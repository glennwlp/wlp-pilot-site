import type { AstroIntegration } from "astro";
import { wlpAstroVitePlugin } from "./vite-plugin.js";
export interface WlpIntegrationOptions {
    /** Project root used to compute relative paths for source-ref. Defaults to process.cwd(). */
    root?: string;
    /**
     * Override the query param name that activates the overlay. Default 'wlp'.
     * Most pilots will keep the default so the portal's iframe URL stays
     * generic (`?wlp=preview`).
     */
    paramName?: string;
    /** Override the value that activates the overlay. Default 'preview'. */
    paramValue?: string;
    /**
     * Allowlist of portal origins that may post `wlp:init` to this iframe.
     * Defaults to the prod portal + dev localhost. Override only if the portal
     * is running on a non-default URL (custom domain, staging environment).
     */
    allowedParentOrigins?: string[];
}
export default function wlpIntegration(options?: WlpIntegrationOptions): AstroIntegration;
export { wlpAstroVitePlugin };
//# sourceMappingURL=index.d.ts.map