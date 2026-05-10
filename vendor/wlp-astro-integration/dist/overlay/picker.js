// Runtime overlay script — runs INSIDE the user's site (the iframe), but
// only when `?wlp=preview` is set on the request URL. Responsibilities:
//
//   1. Hover-highlight any element carrying `[data-wlp-source]`
//   2. Capture clicks on those elements; postMessage the source-ref + a
//      hint at the current value to the parent (portal)
//   3. Suppress the normal click action (link navigation, form submit, etc.)
//      while picking is active so the editor doesn't accidentally navigate
//      away
//   4. (Phase 18) Capture contextmenu (right-click) on those same
//      elements; open the in-iframe Comment / Copy / Inspect menu and
//      emit `wlp:contextmenu` to the parent.
//   5. (Phase 18) Track scroll / resize / per-element bounds so the
//      parent's pin overlay (Phase 19) can keep numbered pins glued
//      to their elements through layout shifts and scroll.
//
// The parent decides what to do with each event — Slice 1 opens an
// EditPanel side panel on click; Phase 19's ThreadPanel opens on the
// `wlp:commentSubmit` from the inline composer.
//
// `event.origin`-validated postMessage in both directions. The parent must
// post a `wlp:init` message on iframe load with its origin so this script
// knows whom to trust and whom to send to.
const DATA_ATTR = "data-wlp-source";
const KIND_ATTR = "data-wlp-kind";
// Phase 21A — link href ref lives on a separate attribute so an <a>
// tag can carry BOTH a text ref (data-wlp-source) AND an href ref
// without overloading one attribute name.
const LINK_HREF_ATTR = "data-wlp-link-href";
// Phase 21B — array iteration items. The parent attr names the array
// in source-ref form (`astro:src/Hero.astro:HERO_CONTENT.items`); the
// index attr names the current iteration index. Both are pilot-dev-
// authored manually for now (walker .map() detection is a follow-up
// per the original Phase 21B plan note).
const ARRAY_PARENT_ATTR = "data-wlp-array-parent";
const ARRAY_INDEX_ATTR = "data-wlp-array-index";
// Phase 22 — opt-in HTML id editing. A component opts in by emitting
// `data-wlp-id-source="<source-ref>"` (the source-ref of the string
// field on the content constant that holds the id) AND
// `data-wlp-id="<current-id>"` (snapshot of the value at render time,
// independent of the live `el.id` property which a prior live-preview
// edit may have mutated). Without these markers the EditPanel's ID
// row stays a disabled stub.
const ID_SOURCE_ATTR = "data-wlp-id-source";
const ID_VALUE_ATTR = "data-wlp-id";
const HOVER_CLASS = "__wlp-hover-highlight";
const DEFAULT_ALLOWED_ORIGINS = [
    "https://app.whitelabelpress.com",
    "http://localhost:3000",
];
import { openMenu } from "./menu.js";
import { openInlineInput } from "./inline-input.js";
let parentOrigin = null;
let userRole = "editor";
// Phase 18 — bounds-tracking state. trackedRefs is the parent-supplied
// allowlist; we only emit bounds for refs the parent explicitly asked
// about. boundsRafScheduled debounces emit calls so a long scroll
// doesn't flood the channel.
let trackedRefs = new Set();
let boundsRafScheduled = false;
let scrollRafScheduled = false;
let resizeRafScheduled = false;
export function installPicker() {
    if (typeof window === "undefined")
        return;
    if (window.__wlpPickerInstalled)
        return;
    window.__wlpPickerInstalled = true;
    const allowed = window.__wlpAllowedParentOrigins ?? DEFAULT_ALLOWED_ORIGINS;
    const allowedSet = new Set(allowed);
    // Listen for the parent's init message to learn its origin. The init message
    // only counts when:
    //   1. The MessageEvent.origin matches the configured allowlist (so a
    //      malicious embedder posting from evil.example can't take over), AND
    //   2. The body's parentOrigin matches event.origin (so a confused parent
    //      claiming a different origin still gets pinned to its real one).
    // Subsequent init messages are ignored — bind once. The role field is
    // optional and defaults to 'editor' if absent or invalid.
    window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data || data.type !== "wlp:init")
            return;
        if (typeof data.parentOrigin !== "string")
            return;
        if (!allowedSet.has(event.origin))
            return;
        if (event.origin !== data.parentOrigin)
            return;
        if (parentOrigin === null) {
            parentOrigin = event.origin;
        }
        if (data.role === "owner" || data.role === "editor") {
            userRole = data.role;
        }
    });
    // Phase 18 — mid-session role flip. Origin-pinned to the already-bound
    // parent; ignored before the init handshake.
    window.addEventListener("message", (event) => {
        if (parentOrigin === null)
            return;
        if (event.origin !== parentOrigin)
            return;
        const data = event.data;
        if (!data || data.type !== "wlp:setRole")
            return;
        if (data.role !== "owner" && data.role !== "editor")
            return;
        userRole = data.role;
    });
    // Phase 18 — parent can ask us to track a specific list of source-refs.
    // We compute their bounds once on receipt and re-emit on scroll/resize.
    window.addEventListener("message", (event) => {
        if (parentOrigin === null)
            return;
        if (event.origin !== parentOrigin)
            return;
        const data = event.data;
        if (!data || data.type !== "wlp:trackElements")
            return;
        if (!Array.isArray(data.sourceRefs))
            return;
        const next = new Set();
        for (const ref of data.sourceRefs) {
            if (typeof ref !== "string")
                continue;
            if (ref.length === 0 || ref.length > 512)
                continue;
            next.add(ref);
        }
        trackedRefs = next;
        sendBoundsBatch();
    });
    // Live-preview channel — apply the EditPanel's keystrokes directly to the
    // DOM so the user sees the change without saving. Origin-pinned to the
    // already-bound parentOrigin (set above by `wlp:init`); no message is
    // honoured before the parent's init handshake.
    window.addEventListener("message", (event) => {
        if (parentOrigin === null)
            return;
        if (event.origin !== parentOrigin)
            return;
        const data = event.data;
        if (!data || data.type !== "wlp:livePreview")
            return;
        if (typeof data.sourceRef !== "string" || data.sourceRef.length === 0) {
            return;
        }
        if (data.sourceRef.length > 512)
            return;
        if (typeof data.newValue !== "string")
            return;
        applyLivePreview(data.sourceRef, data.newValue, data.kind);
    });
    injectStyles();
    attachListeners();
}
function injectStyles() {
    const style = document.createElement("style");
    style.setAttribute("data-wlp", "picker-styles");
    style.textContent = `
    [${DATA_ATTR}] { cursor: pointer; }
    .${HOVER_CLASS} {
      outline: 1px dashed rgb(37 99 235) !important;
      outline-offset: 2px !important;
    }
  `;
    document.head.appendChild(style);
}
function attachListeners() {
    let lastHovered = null;
    document.addEventListener("mouseover", (e) => {
        const target = closestPickable(e.target);
        if (target === lastHovered)
            return;
        if (lastHovered)
            lastHovered.classList.remove(HOVER_CLASS);
        lastHovered = target;
        if (target)
            target.classList.add(HOVER_CLASS);
    }, true);
    document.addEventListener("mouseout", (e) => {
        // Only clear when we leave the picker target itself (not an inner child).
        const related = e.relatedTarget ?? null;
        if (lastHovered && (!related || !lastHovered.contains(related))) {
            lastHovered.classList.remove(HOVER_CLASS);
            lastHovered = null;
        }
    }, true);
    document.addEventListener("click", (e) => {
        const target = closestPickable(e.target);
        if (!target)
            return;
        // Suppress default behaviour — we don't want a link click to navigate.
        e.preventDefault();
        e.stopPropagation();
        sendClickMessage(target);
    }, true);
    // Phase 18 — contextmenu (right-click). Same target rule as click.
    // Suppress the browser menu and open our own at the pointer.
    document.addEventListener("contextmenu", (e) => {
        const target = closestPickable(e.target);
        if (!target)
            return;
        e.preventDefault();
        e.stopPropagation();
        sendContextMenuMessage(target, e);
        openContextMenu(target, e.clientX, e.clientY);
    }, true);
    // Phase 18 — scroll + resize. Emit at most once per animation frame
    // so a fast scroll doesn't flood the postMessage channel. The parent
    // re-positions any active pin overlay based on these.
    window.addEventListener("scroll", () => {
        if (scrollRafScheduled)
            return;
        scrollRafScheduled = true;
        requestAnimationFrame(() => {
            scrollRafScheduled = false;
            sendScroll();
        });
        sendBoundsBatch();
    }, { passive: true });
    window.addEventListener("resize", () => {
        if (resizeRafScheduled)
            return;
        resizeRafScheduled = true;
        requestAnimationFrame(() => {
            resizeRafScheduled = false;
            sendResize();
        });
        sendBoundsBatch();
    });
}
function closestPickable(t) {
    if (!t || !(t instanceof Element))
        return null;
    // Phase 21A/B/22: an element is pickable if it carries any of the
    // editable-marker attributes. Element with only data-wlp-id-source
    // (and no text ref) is rare in practice — id editing usually rides
    // alongside a text ref — but kept selectable so the EditPanel can
    // surface the ID row even on otherwise non-text elements (e.g. an
    // anchor target marker on a <section> wrapper).
    return t.closest(`[${DATA_ATTR}], [${LINK_HREF_ATTR}], [${ARRAY_PARENT_ATTR}], [${ID_SOURCE_ATTR}]`);
}
function sendContextMenuMessage(el, ev) {
    if (!parentOrigin)
        return;
    const sourceRef = el.getAttribute(DATA_ATTR);
    if (!sourceRef)
        return;
    const kindAttr = el.getAttribute(KIND_ATTR);
    const kind = kindAttr === "image" || kindAttr === "video" ? kindAttr : "text";
    const rect = el.getBoundingClientRect();
    const message = {
        type: "wlp:contextmenu",
        sourceRef,
        kind,
        currentValue: extractCurrentValue(el, kind),
        rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        pointer: { x: ev.clientX, y: ev.clientY },
    };
    window.parent.postMessage(message, parentOrigin);
}
function openContextMenu(el, x, y) {
    const sourceRef = el.getAttribute(DATA_ATTR) ?? "";
    const kindAttr = el.getAttribute(KIND_ATTR);
    const kind = kindAttr === "image" || kindAttr === "video" ? kindAttr : "text";
    const items = [
        { id: "comment", label: "Comment" },
        { id: "copy", label: "Copy source ref", caption: sourceRef },
    ];
    // Inspect is owner-only — surfaces the literal source-ref + the
    // file/post path. Useful for owners debugging the picker; surfaced
    // to editors would just confuse them.
    if (userRole === "owner") {
        items.push({ id: "inspect", label: "Inspect" });
    }
    openMenu({ x, y }, items, (id) => {
        if (id === "comment") {
            const selectionText = extractCurrentValue(el, kind) || null;
            // Offset the input slightly below the pointer so it doesn't
            // immediately overlap the element the user just right-clicked.
            openInlineInput({ x, y: y + 4 }, {
                placeholder: "Leave a comment for the agent…",
                onResolve: (result) => {
                    if (result.kind !== "submit")
                        return;
                    sendCommentSubmit(sourceRef, result.body, selectionText);
                },
            });
            return;
        }
        if (id === "copy") {
            // Best-effort — old WebViews and insecure-context iframes lack
            // navigator.clipboard. Fall back to the parent: it can render a
            // copy CTA off the contextmenu event we already sent.
            if (typeof navigator !== "undefined" &&
                navigator.clipboard &&
                typeof navigator.clipboard.writeText === "function") {
                void navigator.clipboard.writeText(sourceRef);
            }
            return;
        }
        if (id === "inspect") {
            sendInspect(sourceRef);
            return;
        }
    });
}
function sendCommentSubmit(sourceRef, body, selectionText) {
    if (!parentOrigin)
        return;
    const message = {
        type: "wlp:commentSubmit",
        sourceRef,
        body,
        selectionText,
    };
    window.parent.postMessage(message, parentOrigin);
}
function sendInspect(sourceRef) {
    if (!parentOrigin)
        return;
    const message = {
        type: "wlp:inspect",
        sourceRef,
    };
    window.parent.postMessage(message, parentOrigin);
}
function sendScroll() {
    if (!parentOrigin)
        return;
    const message = {
        type: "wlp:scroll",
        scrollX: window.scrollX,
        scrollY: window.scrollY,
    };
    window.parent.postMessage(message, parentOrigin);
}
function sendResize() {
    if (!parentOrigin)
        return;
    const message = {
        type: "wlp:viewportResize",
        width: window.innerWidth,
        height: window.innerHeight,
    };
    window.parent.postMessage(message, parentOrigin);
}
/**
 * Compute current bounds for every tracked source-ref and emit them as a
 * single batch. Multiple emits within the same animation frame collapse
 * to one (boundsRafScheduled flag) — a synchronous trackElements +
 * scroll firing back-to-back doesn't double-fire.
 */
function sendBoundsBatch() {
    if (!parentOrigin)
        return;
    if (trackedRefs.size === 0)
        return;
    if (boundsRafScheduled)
        return;
    boundsRafScheduled = true;
    // Most callers (scroll/resize) are already in rAF context; we still
    // schedule another one so a manual trackElements call coalesces with
    // any scroll fired in the same tick.
    requestAnimationFrame(() => {
        boundsRafScheduled = false;
        if (!parentOrigin)
            return;
        const items = [];
        for (const ref of trackedRefs) {
            const el = document.querySelector(`[${DATA_ATTR}="${escapeAttrValue(ref)}"]`);
            if (!el) {
                items.push({ sourceRef: ref, rect: null });
                continue;
            }
            const rect = el.getBoundingClientRect();
            items.push({
                sourceRef: ref,
                rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            });
        }
        const message = {
            type: "wlp:elementBoundsBatch",
            items,
        };
        window.parent.postMessage(message, parentOrigin);
    });
}
function sendClickMessage(el) {
    if (!parentOrigin)
        return;
    // Phase 21B — array-item branch. If the click landed on an element
    // marked with data-wlp-array-parent, treat the click as a reorder
    // intent regardless of whether the same element ALSO has a text/
    // link ref. The picker collects every sibling sharing the same
    // parent ref + their auto-discovered labels (textContent truncated)
    // so EditPanel's reorder UI can render the full list. Closest <a>
    // /text intent on the same element is reachable via "Edit text"
    // toggle in EditPanel (UI follow-up); for now, picking an array
    // item opens the reorder panel.
    const arrayParentRef = el.getAttribute(ARRAY_PARENT_ATTR);
    const arrayIndexRaw = el.getAttribute(ARRAY_INDEX_ATTR);
    if (arrayParentRef && arrayIndexRaw) {
        const arrayIndex = Number.parseInt(arrayIndexRaw, 10);
        if (Number.isInteger(arrayIndex) && arrayIndex >= 0) {
            // Collect every sibling under the same parent ref, INCLUDING the
            // clicked element itself. querySelectorAll on document because
            // the iteration may not share a DOM parent (e.g. flex items
            // wrapped in different fragments). Same-attribute-value match
            // is the contract.
            const escapedParent = escapeAttrValue(arrayParentRef);
            const siblings = document.querySelectorAll(`[${ARRAY_PARENT_ATTR}="${escapedParent}"][${ARRAY_INDEX_ATTR}]`);
            const arrayItems = [];
            const seenIndices = new Set();
            siblings.forEach((sib) => {
                const raw = sib.getAttribute(ARRAY_INDEX_ATTR);
                if (raw === null)
                    return;
                const idx = Number.parseInt(raw, 10);
                if (!Number.isInteger(idx) || idx < 0)
                    return;
                if (seenIndices.has(idx))
                    return;
                seenIndices.add(idx);
                const label = (sib.textContent ?? "").trim().slice(0, 80) || `Item ${idx + 1}`;
                arrayItems.push({ index: idx, label });
            });
            arrayItems.sort((a, b) => a.index - b.index);
            const rect = el.getBoundingClientRect();
            const message = {
                type: "wlp:elementClicked",
                sourceRef: arrayParentRef,
                kind: "array-item",
                currentValue: "",
                rect: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                },
                arrayParentRef,
                arrayIndex,
                arrayItems,
            };
            window.parent.postMessage(message, parentOrigin);
            return;
        }
    }
    // Phase 21A — if the element has a link-href ref, treat it as a link
    // edit regardless of whether data-wlp-source is also present:
    //   <a data-wlp-source="…label" data-wlp-link-href="…href">{label}</a>
    //     → kind="link", sourceRef=label-ref, linkHrefRef=href-ref
    //   <a data-wlp-link-href="…href">Static label</a>
    //     → kind="link", sourceRef=href-ref (so the panel still has
    //       SOMETHING to anchor on), linkHrefRef=href-ref, currentValue=
    //       href value (panel renders only the URL textarea)
    const linkHrefRef = el.getAttribute(LINK_HREF_ATTR);
    if (linkHrefRef && el instanceof HTMLAnchorElement) {
        const textRef = el.getAttribute(DATA_ATTR);
        const rect = el.getBoundingClientRect();
        const message = {
            type: "wlp:elementClicked",
            sourceRef: textRef ?? linkHrefRef,
            kind: "link",
            currentValue: textRef ? (el.textContent?.trim() ?? "") : (el.getAttribute("href") ?? ""),
            linkHrefRef,
            currentHrefValue: el.getAttribute("href") ?? "",
            rect: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            },
        };
        window.parent.postMessage(message, parentOrigin);
        return;
    }
    const sourceRef = el.getAttribute(DATA_ATTR);
    if (!sourceRef)
        return;
    const kindAttr = el.getAttribute(KIND_ATTR);
    const kind = kindAttr === "image" || kindAttr === "video" ? kindAttr : "text";
    // Phase 22 — opt-in id editing markers. Forwarded only when the
    // component author emitted them; absent otherwise so the parent's
    // EditPanel ID row stays a stub.
    const idSourceRef = el.getAttribute(ID_SOURCE_ATTR);
    const currentId = el.getAttribute(ID_VALUE_ATTR);
    const rect = el.getBoundingClientRect();
    const message = {
        type: "wlp:elementClicked",
        sourceRef,
        kind,
        currentValue: extractCurrentValue(el, kind),
        rect: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        },
        ...(idSourceRef ? { idSourceRef } : {}),
        ...(currentId !== null ? { currentId } : {}),
    };
    window.parent.postMessage(message, parentOrigin);
}
/**
 * Apply a live-preview value to every element matching `data-wlp-source`.
 * Multiple matches are valid (an array.map can produce N elements with the
 * same source-ref pattern, though the index makes them distinct in practice).
 * For text we replace `textContent`; for image/video we update `src`. Empty
 * matches are silent — the parent might be racing the iframe load.
 */
function applyLivePreview(sourceRef, newValue, kindHint) {
    const escaped = escapeAttrValue(sourceRef);
    // Phase 21A — link-href lives on a different attribute. The selector
    // and mutation both diverge from the text/media path: find by
    // [data-wlp-link-href="…"] then setAttribute('href', value).
    if (kindHint === "link-href") {
        const els = document.querySelectorAll(`[${LINK_HREF_ATTR}="${escaped}"]`);
        els.forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("href", newValue);
            }
        });
        return;
    }
    // Phase 22 — id mutation. Selector is [data-wlp-id-source="…"] (NOT
    // data-wlp-source — the id source-ref is a sibling-field ref distinct
    // from the text source-ref, so they can't share the selector). Empty
    // string clears the attribute, matching the HTMLElement.id contract.
    if (kindHint === "id") {
        const els = document.querySelectorAll(`[${ID_SOURCE_ATTR}="${escaped}"]`);
        els.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.id = newValue;
            }
        });
        return;
    }
    const els = document.querySelectorAll(`[${DATA_ATTR}="${escaped}"]`);
    if (els.length === 0)
        return;
    els.forEach((el) => {
        const kindAttr = el.getAttribute(KIND_ATTR);
        const kind = kindHint ??
            (kindAttr === "image" || kindAttr === "video" ? kindAttr : "text");
        if (kind === "image" && el instanceof HTMLImageElement) {
            el.src = newValue;
            return;
        }
        if (kind === "video" &&
            (el instanceof HTMLVideoElement || el instanceof HTMLSourceElement)) {
            el.src = newValue;
            return;
        }
        el.textContent = newValue;
    });
}
/** Escape `"` and `\` in an attribute value so it's safe inside `[attr="..."]`. */
function escapeAttrValue(s) {
    return s.replace(/[\\"]/g, "\\$&");
}
function extractCurrentValue(el, kind) {
    if (kind === "image" && el instanceof HTMLImageElement)
        return el.src;
    if (kind === "video" &&
        (el instanceof HTMLVideoElement || el instanceof HTMLSourceElement)) {
        return el.src;
    }
    return el.textContent?.trim() ?? "";
}
// Self-mount when this module is loaded as a script. Build pipeline (Vite)
// will inline this as a `<script type="module">` only when ?wlp=preview is
// active (gated by the integration entry).
installPicker();
//# sourceMappingURL=picker.js.map