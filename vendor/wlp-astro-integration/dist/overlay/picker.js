// Runtime overlay script — runs INSIDE the user's site (the iframe), but
// only when `?wlp=preview` is set on the request URL. Responsibilities:
//
//   1. Hover-highlight any element carrying `[data-wlp-source]`
//   2. Capture clicks on those elements; postMessage the source-ref + a
//      hint at the current value to the parent (portal)
//   3. Suppress the normal click action (link navigation, form submit, etc.)
//      while picking is active so the editor doesn't accidentally navigate
//      away
//
// The parent decides what to do with the click — Slice 1 opens an EditPanel
// side panel. Phase 18 will extend this script with a contextmenu listener
// for the commenting flow.
//
// `event.origin`-validated postMessage in both directions. The parent must
// post a `wlp:init` message on iframe load with its origin so this script
// knows whom to trust and whom to send to.
const DATA_ATTR = "data-wlp-source";
const KIND_ATTR = "data-wlp-kind";
const HOVER_CLASS = "__wlp-hover-highlight";
const DEFAULT_ALLOWED_ORIGINS = [
    "https://app.whitelabelpress.com",
    "http://localhost:3000",
];
let parentOrigin = null;
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
    // Subsequent init messages are ignored — bind once.
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
}
function closestPickable(t) {
    if (!t || !(t instanceof Element))
        return null;
    return t.closest(`[${DATA_ATTR}]`);
}
function sendClickMessage(el) {
    if (!parentOrigin)
        return;
    const sourceRef = el.getAttribute(DATA_ATTR);
    if (!sourceRef)
        return;
    const kindAttr = el.getAttribute(KIND_ATTR);
    const kind = kindAttr === "image" || kindAttr === "video" ? kindAttr : "text";
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
    };
    window.parent.postMessage(message, parentOrigin);
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