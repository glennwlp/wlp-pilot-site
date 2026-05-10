import type { EmbeddedMedia, WpPost } from "./types.js";
export declare class AstroSectionsFetchError extends Error {
    readonly status: number | null;
    readonly url: string;
    constructor(message: string, opts: {
        status?: number | null;
        url: string;
        cause?: unknown;
    });
}
export interface FetchOptions {
    /** Tenant WP base URL, e.g. `https://example.com`. Trailing slash optional. */
    wpUrl: string;
    /** Per-call timeout. Default 30s. */
    timeoutMs?: number;
    /** Extra headers (e.g. an `Authorization` bearer for tenants gating reads). */
    headers?: Record<string, string>;
    /** Injectable for tests. Defaults to `globalThis.fetch`. */
    fetch?: typeof fetch;
}
export interface CollectionParams extends FetchOptions {
    /** Items per page. Defaults to 10. Capped at 100 (WP REST max). */
    perPage?: number;
    /** 1-based page number for pagination. Default 1. */
    page?: number;
    /**
     * Sort field. Core fields (`date`, `menu_order`) pass through. `acf.<name>`
     * is translated to `orderby=meta_value&meta_key=<name>`, which only works
     * when the tenant has registered the meta key for query via a server-side
     * filter. Unsupported keys silently fall back to WP's default ordering.
     */
    orderBy?: "date" | "menu_order" | `acf.${string}`;
    /** Sort direction. Default `desc`. */
    order?: "asc" | "desc";
    /** Free-text search across the post type. */
    search?: string;
    /** When true (default), appends `_embed=wp:featuredmedia`. */
    embedFeaturedMedia?: boolean;
}
/**
 * Fetch a list of posts from a post type's REST endpoint. Returns `[]` when
 * the response is an empty list. Throws on any non-2xx (404 on a list
 * endpoint is treated as "post type not registered" → throw).
 */
export declare function fetchCollection(restBase: string, params: CollectionParams): Promise<WpPost[]>;
/**
 * Fetch a single post from a post type by slug. Returns `null` when no post
 * matches the slug. Includes `_embed=wp:featuredmedia` so the resolver can
 * find the featured image without an extra round-trip.
 */
export declare function fetchPost(restBase: string, slug: string, options: FetchOptions): Promise<WpPost | null>;
/**
 * Fetch a batch of media attachments by id. De-duplicates the input set and
 * preserves caller order via `orderby=include`. Returns `[]` for an empty
 * input. Throws if the deduped set exceeds the WP REST `per_page` cap (100).
 */
export declare function fetchMediaBatch(ids: number[], options: FetchOptions): Promise<EmbeddedMedia[]>;
/**
 * Fetch a batch of related posts by id from a single post type. Same dedupe
 * + order semantics as `fetchMediaBatch`. Used by `<RelatedItems>` after the
 * resolver pulls an id list out of an ACF relationship field.
 */
export declare function fetchRelatedBatch(restBase: string, ids: number[], options: FetchOptions): Promise<WpPost[]>;
/**
 * Fold a batch of fetched media into each post's
 * `_embedded["wp:featuredmedia"]` so `asImageUrl(post, id)` resolves
 * uniformly — for both featured images returned by `_embed` and ACF gallery
 * / image-field attachments fetched separately.
 *
 * Pure: returns new post objects, leaves the input untouched.
 */
export declare function attachMediaToPosts(posts: WpPost[], media: EmbeddedMedia[]): WpPost[];
/**
 * Walk a post + a list of `FieldPath`s, return the set of attachment IDs
 * that are referenced but NOT yet present in `post._embedded["wp:featuredmedia"]`.
 * Consumers pass the result to `fetchMediaBatch` to fill the gap in one round-trip.
 *
 * Tolerant: paths that resolve to non-attachment values are skipped silently;
 * this is a "give me the IDs you can find" helper, not a validator.
 */
export declare function collectMissingMediaIds(posts: WpPost[], paths: string[]): number[];
//# sourceMappingURL=fetch.d.ts.map