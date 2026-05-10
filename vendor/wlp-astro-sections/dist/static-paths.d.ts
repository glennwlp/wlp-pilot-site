export interface GetStaticPathsForOptions {
    /** Tenant WP base URL — same value the page passes to `<DetailPage>`. */
    wpUrl: string;
    /**
     * Cap on the number of posts/routes generated. WP REST max is 100; pass
     * higher only after you've tuned the WP server. Default 100.
     */
    perPage?: number;
    /**
     * Param name on the dynamic-route filename. Default `slug` — matches the
     * Astro convention `src/pages/properties/[slug].astro`.
     */
    paramName?: string;
    /** Optional override (testing). Mirrors `fetchCollection`'s injection. */
    fetch?: typeof fetch;
    /** Optional timeout. */
    timeoutMs?: number;
}
/**
 * Build the `getStaticPaths` function Astro expects on a dynamic page.
 *
 * `restBase` is the WP REST base segment (e.g. "property", "team-member").
 * The returned function is async and is exported as `getStaticPaths` from
 * the page's frontmatter.
 */
export declare function getStaticPathsFor(restBase: string, options: GetStaticPathsForOptions): () => Promise<Array<{
    params: Record<string, string>;
}>>;
//# sourceMappingURL=static-paths.d.ts.map