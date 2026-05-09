import type { Plugin } from "vite";
interface PluginOptions {
    /** Project root used to compute relative paths for source-ref. */
    root?: string;
}
export declare function wlpAstroVitePlugin(options?: PluginOptions): Plugin;
/**
 * Pure transform: parse an `.astro` source string, walk its AST, splice in
 * `data-wlp-source` attributes for each content-constant binding, and return
 * the mutated source. Returns `null` when there's nothing to inject (no
 * frontmatter constants, no markup-expression hits) or when parsing fails —
 * callers should fall through to their default behaviour.
 *
 * Exported so tests can drive the transform directly without staging the
 * file on disk + going through Vite's `load` hook.
 */
export declare function mutateAstroSource(code: string, relPath: string): Promise<string | null>;
export {};
//# sourceMappingURL=vite-plugin.d.ts.map