import type { FieldPath, WpPost } from "./types.js";
type Step = {
    kind: "key";
    name: string;
} | {
    kind: "index";
    value: number;
};
/**
 * Tokenise a FieldPath into walk steps. Throws on malformed input.
 */
export declare function parsePath(path: FieldPath): Step[];
/**
 * Resolve a FieldPath against a WpPost. Returns `null` on any miss, malformed
 * path, or type mismatch. Never throws.
 */
export declare function resolvePath(post: WpPost, path: FieldPath): unknown;
export declare function asString(v: unknown): string | null;
export declare function asNumber(v: unknown): number | null;
/**
 * Coerce a WP attachment reference to an attachment ID. WP returns these as
 * raw numbers (core `featured_media`), as objects with `.id` (ACF
 * `return_format=object`), or as URL-form strings (rare). We accept the first
 * two; URL-form strings are handled by `asImageUrl` directly.
 */
export declare function asImageId(v: unknown): number | null;
/**
 * Resolve an attachment reference to a URL. Three input shapes:
 *  1. Number / `{id}` — looked up against `post._embedded["wp:featuredmedia"]`.
 *  2. Object with `.url` (ACF `return_format=array`) or `.source_url`.
 *  3. String — accepted as-is (treated as a URL).
 *
 * Returns `null` when no resolution path applies. Slice 22B will add a
 * batched fallback fetch for IDs that aren't in `_embedded`; for now the
 * scaffold returns null in that case.
 */
export declare function asImageUrl(post: WpPost, v: unknown): string | null;
/**
 * Coerce an ACF relationship field value to an array of post IDs. ACF
 * relationships return numbers when `return_format=id`, post objects when
 * `return_format=object`. We accept both shapes.
 */
export declare function asPostIds(v: unknown): number[] | null;
/**
 * Soft array guard. Returns `null` for non-arrays so a primitive's empty-
 * state branch can render without a runtime exception.
 */
export declare function asArray(v: unknown): unknown[] | null;
export {};
//# sourceMappingURL=resolver.d.ts.map