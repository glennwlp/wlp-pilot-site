// Astro integration entry. Two responsibilities:
//
//   1. Register the Vite plugin that emits `data-wlp-source` attributes
//      onto markup expressions bound to content constants.
//   2. Inject a `<script type="module">` that boots the overlay picker —
//      but only when the request URL has `?wlp=preview` (the portal
//      embeds the iframe with that query).
//
// The picker mounts itself on import. We wrap its source in a small
// runtime gate so a casual visitor who happens to hit `?wlp=preview`
// (without a parent posting `wlp:init`) gets no observable effect.
import { wlpAstroVitePlugin } from "./vite-plugin.js";
const DEFAULT_PARAM_NAME = "wlp";
const DEFAULT_PARAM_VALUE = "preview";
const DEFAULT_ALLOWED_PARENT_ORIGINS = [
    "https://app.whitelabelpress.com",
    "http://localhost:3000",
];
export default function wlpIntegration(options = {}) {
    const paramName = options.paramName ?? DEFAULT_PARAM_NAME;
    const paramValue = options.paramValue ?? DEFAULT_PARAM_VALUE;
    const allowedParentOrigins = options.allowedParentOrigins ?? DEFAULT_ALLOWED_PARENT_ORIGINS;
    const root = options.root;
    return {
        name: "@whitelabelpress/astro-integration",
        hooks: {
            "astro:config:setup": ({ updateConfig, injectScript }) => {
                updateConfig({
                    vite: {
                        plugins: [
                            wlpAstroVitePlugin(root ? { root } : {}),
                        ],
                    },
                });
                // Inject a tiny boot stub on every page. The stub checks the URL
                // and dynamically imports the picker only on activation, so the
                // overlay code is dead weight on real public visits.
                const allowedJson = JSON.stringify(allowedParentOrigins);
                injectScript("page", `
if (new URLSearchParams(location.search).get(${JSON.stringify(paramName)}) === ${JSON.stringify(paramValue)}) {
  window.__wlpAllowedParentOrigins = ${allowedJson};
  import("@whitelabelpress/astro-integration/overlay-picker");
}
`);
            },
        },
    };
}
export { wlpAstroVitePlugin };
//# sourceMappingURL=index.js.map