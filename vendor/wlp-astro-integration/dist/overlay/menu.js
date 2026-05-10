// In-iframe context-menu DOM. Pure factory — knows nothing about
// source-refs, postMessage, or roles. The picker hands it a coords
// pair, a list of items, and a callback; it builds a small floating
// menu and resolves the callback on a pick.
//
// One menu instance at a time — calling openMenu while an existing
// menu is open closes the prior one first. Click-outside and Escape
// both dismiss without picking. The caller's `onPick` is the only
// signal that an item was chosen; pure dismissal calls nothing.
const ROOT_ID = "__wlp-context-menu";
let currentClose = null;
export function openMenu(coords, items, onPick) {
    // One at a time — a stale menu would intercept clicks meant for the
    // new one's items.
    if (currentClose)
        currentClose();
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("role", "menu");
    root.setAttribute("data-wlp-overlay", "menu");
    root.style.cssText = [
        "position: fixed",
        `left: ${coords.x}px`,
        `top: ${coords.y}px`,
        "z-index: 2147483646",
        "min-width: 180px",
        "padding: 4px",
        "background: white",
        "color: rgb(15 23 42)",
        "border: 1px solid rgb(226 232 240)",
        "border-radius: 6px",
        "box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12)",
        "font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        // Keep the menu inside the viewport — translate up/left when the
        // pointer was near the right/bottom edge. Cheap heuristic; the
        // parent's PreviewPane renders pins from `wlp:elementBoundsBatch`
        // and doesn't depend on this menu's position.
        coords.x > window.innerWidth - 200 ? "transform: translateX(-100%)" : "",
        coords.y > window.innerHeight - 220 ? "transform-origin: bottom" : "",
    ]
        .filter(Boolean)
        .join(";");
    for (const item of items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.wlpItem = item.id;
        btn.setAttribute("role", "menuitem");
        btn.style.cssText = [
            "display: block",
            "width: 100%",
            "padding: 6px 10px",
            "border: 0",
            "background: transparent",
            "color: inherit",
            "text-align: left",
            "font: inherit",
            "border-radius: 4px",
            "cursor: pointer",
        ].join(";");
        btn.addEventListener("mouseenter", () => {
            btn.style.background = "rgb(241 245 249)";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.background = "transparent";
        });
        btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            // Resolve the callback BEFORE close() so the consumer can chain
            // openInlineInput synchronously (avoids a flash of bare iframe).
            onPick(item.id);
            close();
        });
        const label = document.createElement("span");
        label.textContent = item.label;
        label.style.fontWeight = "500";
        btn.appendChild(label);
        if (item.caption) {
            const cap = document.createElement("span");
            cap.textContent = item.caption;
            cap.style.cssText = [
                "display: block",
                "color: rgb(100 116 139)",
                "font-size: 11px",
                "margin-top: 2px",
            ].join(";");
            btn.appendChild(cap);
        }
        root.appendChild(btn);
    }
    document.body.appendChild(root);
    // Click-outside + Escape dismiss. Both are single-use — the menu
    // is short-lived; not worth a MutationObserver.
    const onDocClick = (ev) => {
        if (!(ev.target instanceof Node) || !root.contains(ev.target)) {
            close();
        }
    };
    const onKey = (ev) => {
        if (ev.key === "Escape") {
            ev.preventDefault();
            close();
        }
    };
    // Defer the click-outside listener by one tick so the same click
    // that opened the menu doesn't immediately close it.
    setTimeout(() => {
        document.addEventListener("click", onDocClick, true);
        document.addEventListener("keydown", onKey, true);
    }, 0);
    function close() {
        document.removeEventListener("click", onDocClick, true);
        document.removeEventListener("keydown", onKey, true);
        if (root.parentNode)
            root.parentNode.removeChild(root);
        if (currentClose === close)
            currentClose = null;
    }
    currentClose = close;
    return close;
}
//# sourceMappingURL=menu.js.map