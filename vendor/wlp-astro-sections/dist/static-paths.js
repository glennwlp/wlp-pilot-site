// `getStaticPaths` helper for tenant Astro pages that render a per-post
// route from a WordPress post type — Phase 22, Slice 22B (`<DetailPage>`).
//
// Usage in a tenant `.astro` page:
//
//   ---
//   import DetailPage from "@whitelabelpress/astro-sections/components/DetailPage.astro";
//   import { getStaticPathsFor } from "@whitelabelpress/astro-sections";
//
//   export const getStaticPaths = getStaticPathsFor("property", {
//     wpUrl: "https://acss.whitelabelpress.com",
//   });
//
//   const { slug } = Astro.params;
//   ---
//   <DetailPage postType="property" wpUrl="https://acss..." slug={slug} mapping={...} />
//
// The returned function calls `fetchCollection(restBase, ...)` once at
// build time, projects each post into Astro's `{ params: { slug } }`
// shape, and returns the array. Errors propagate — a wrong wpUrl or an
// unregistered post type should fail the build, not silently produce
// zero routes.
import { fetchCollection } from "./fetch.js";
/**
 * Build the `getStaticPaths` function Astro expects on a dynamic page.
 *
 * `restBase` is the WP REST base segment (e.g. "property", "team-member").
 * The returned function is async and is exported as `getStaticPaths` from
 * the page's frontmatter.
 */
export function getStaticPathsFor(restBase, options) {
    const paramName = options.paramName ?? "slug";
    return async () => {
        const posts = await fetchCollection(restBase, {
            wpUrl: options.wpUrl,
            perPage: options.perPage ?? 100,
            embedFeaturedMedia: false, // we don't need embed for path generation
            ...(options.fetch ? { fetch: options.fetch } : {}),
            ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        });
        const out = [];
        for (const post of posts) {
            const slug = post?.slug;
            if (typeof slug === "string" && slug.length > 0) {
                out.push({ params: { [paramName]: slug } });
            }
        }
        return out;
    };
}
//# sourceMappingURL=static-paths.js.map