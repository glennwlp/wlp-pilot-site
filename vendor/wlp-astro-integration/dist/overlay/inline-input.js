// In-iframe inline comment composer. Built when the user picks
// "Comment" from the context menu — a small floating textarea +
// Submit/Cancel pinned to the selection coords.
//
// Pure DOM — keystrokes don't postMessage; the parent only hears
// from us when the user clicks Submit, at which point we surface
// the comment body and let the parent POST to /api/comments.
// Escape cancels; click-outside cancels; clicking Submit with an
// empty body keeps the input focused so the user has to type
// SOMETHING before submission.
const ROOT_ID = "__wlp-inline-input";
const MAX_BODY_LENGTH = 4000;
let currentClose = null;
export function openInlineInput(coords, options) {
    if (currentClose)
        currentClose();
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("data-wlp-overlay", "inline-input");
    root.style.cssText = [
        "position: fixed",
        `left: ${coords.x}px`,
        `top: ${coords.y}px`,
        "z-index: 2147483646",
        "width: min(320px, calc(100vw - 24px))",
        "padding: 10px 10px 8px",
        "background: white",
        "color: rgb(15 23 42)",
        "border: 1px solid rgb(226 232 240)",
        "border-radius: 8px",
        "box-shadow: 0 6px 24px rgba(15, 23, 42, 0.18)",
        "font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        coords.x > window.innerWidth - 340 ? "transform: translateX(-100%)" : "",
    ]
        .filter(Boolean)
        .join(";");
    const textarea = document.createElement("textarea");
    textarea.placeholder = options.placeholder ?? "Leave a comment…";
    textarea.maxLength = MAX_BODY_LENGTH;
    textarea.rows = 3;
    textarea.style.cssText = [
        "display: block",
        "width: 100%",
        "padding: 8px",
        "border: 1px solid rgb(203 213 225)",
        "border-radius: 4px",
        "font: inherit",
        "color: inherit",
        "resize: vertical",
        "min-height: 60px",
        "max-height: 240px",
        "outline: none",
        "box-sizing: border-box",
    ].join(";");
    textarea.addEventListener("focus", () => {
        textarea.style.borderColor = "rgb(37 99 235)";
    });
    textarea.addEventListener("blur", () => {
        textarea.style.borderColor = "rgb(203 213 225)";
    });
    const actions = document.createElement("div");
    actions.style.cssText = [
        "display: flex",
        "justify-content: flex-end",
        "gap: 8px",
        "margin-top: 8px",
    ].join(";");
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.dataset.wlpItem = "cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = buttonCss({ primary: false });
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.dataset.wlpItem = "submit";
    submitBtn.textContent = "Comment";
    submitBtn.style.cssText = buttonCss({ primary: true });
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    root.appendChild(textarea);
    root.appendChild(actions);
    document.body.appendChild(root);
    // Defer focus so jsdom-style synthetic test environments (and real
    // browsers that batch focus through layout) reliably move the cursor
    // into the textarea.
    setTimeout(() => textarea.focus(), 0);
    let resolved = false;
    function resolve(result) {
        if (resolved)
            return;
        resolved = true;
        options.onResolve(result);
        close();
    }
    function trySubmit() {
        const body = textarea.value.trim();
        if (body.length === 0) {
            // Empty body — keep the textarea open and focused; the user
            // hasn't made a real comment yet.
            textarea.focus();
            return;
        }
        if (body.length > MAX_BODY_LENGTH) {
            // Defense in depth — maxlength on the textarea bounds keystrokes,
            // but a paste of 4000+ chars could land. Truncate silently before
            // surfacing to the parent so the API's Zod cap doesn't reject.
            resolve({ kind: "submit", body: body.slice(0, MAX_BODY_LENGTH) });
            return;
        }
        resolve({ kind: "submit", body });
    }
    submitBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        trySubmit();
    });
    cancelBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        resolve({ kind: "cancel" });
    });
    // Cmd/Ctrl+Enter submits (matches the chat composer's keybinding).
    textarea.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
            ev.preventDefault();
            trySubmit();
        }
        else if (ev.key === "Escape") {
            ev.preventDefault();
            resolve({ kind: "cancel" });
        }
    });
    const onDocClick = (ev) => {
        if (!(ev.target instanceof Node) || !root.contains(ev.target)) {
            resolve({ kind: "cancel" });
        }
    };
    setTimeout(() => {
        document.addEventListener("click", onDocClick, true);
    }, 0);
    function close() {
        document.removeEventListener("click", onDocClick, true);
        if (root.parentNode)
            root.parentNode.removeChild(root);
        if (currentClose === close)
            currentClose = null;
    }
    currentClose = close;
    return () => resolve({ kind: "cancel" });
}
function buttonCss(opts) {
    return [
        "padding: 6px 12px",
        "border-radius: 4px",
        "font: 12px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-weight: 600",
        "cursor: pointer",
        "border: 1px solid transparent",
        opts.primary
            ? "background: rgb(37 99 235); color: white"
            : "background: white; color: rgb(71 85 105); border-color: rgb(203 213 225)",
    ].join(";");
}
//# sourceMappingURL=inline-input.js.map