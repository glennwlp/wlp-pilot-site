// Batched WordPress REST helpers used by the collection primitives.
//
// The package runs inside the tenant's Astro build (SSG) or SSR render — it
// is NOT the portal's authenticated `lib/wp-client.ts`. Every call here hits
// the public `/wp-json/wp/v2/...` surface of the tenant's WP, with an optional
// `headers` escape hatch for tenants that gate published reads.
//
// Error contract:
//   - Network failures, aborts, and non-2xx responses **throw**. A wrong
//     `wpUrl` or a typo'd `restBase` is a developer-visible bug; failing the
//     build (or the SSR render) is the right answer.
//   - `fetchPost` returns `null` when no post matches the slug — that's a
//     data-shape miss, not a config error, and the primitive's empty state
//     should render.
//   - `fetchCollection` returns `[]` for a 200 with an empty list. Same for
//     the batch helpers when the input id set is empty.
//
// `_embed=wp:featuredmedia` is added to collection fetches by default so the
// 90% case (each card has a featured image) resolves in one round-trip. ACF
// gallery / attachment fields whose IDs aren't in `_embedded` are picked up
// via a single `fetchMediaBatch(ids)` follow-up; the helper
// `attachMediaToPosts` folds the result back into each post's
// `_embedded["wp:featuredmedia"]` so `asImageUrl` resolves uniformly.
/** Default per-call timeout. Astro builds tolerate longer waits than serverless. */
const DEFAULT_TIMEOUT_MS = 30_000;
/** WP REST hard cap on `per_page`. */
const WP_PER_PAGE_MAX = 100;
export class AstroSectionsFetchError extends Error {
    status;
    url;
    constructor(message, opts) {
        super(message);
        this.name = "AstroSectionsFetchError";
        this.status = opts.status ?? null;
        this.url = opts.url;
        if (opts.cause !== undefined) {
            this.cause = opts.cause;
        }
    }
}
// ---------- URL building ----------
function canonicalizeWpUrl(wpUrl) {
    if (typeof wpUrl !== "string" || wpUrl.length === 0) {
        throw new AstroSectionsFetchError("wpUrl is required", { url: String(wpUrl) });
    }
    let trimmed = wpUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        throw new AstroSectionsFetchError(`wpUrl must start with http(s)://, got '${trimmed}'`, { url: trimmed });
    }
    while (trimmed.endsWith("/"))
        trimmed = trimmed.slice(0, -1);
    return trimmed;
}
function restRoot(wpUrl) {
    return `${canonicalizeWpUrl(wpUrl)}/wp-json/wp/v2`;
}
function encodeRestBase(restBase) {
    if (typeof restBase !== "string" || restBase.length === 0) {
        throw new AstroSectionsFetchError("restBase is required", { url: "" });
    }
    // restBase is a single path segment like "property" or "posts". Reject any
    // path-shaped value so a tenant CMS author can't redirect the URL.
    if (/[\\/?#]/.test(restBase)) {
        throw new AstroSectionsFetchError(`restBase must be a single path segment, got '${restBase}'`, { url: restBase });
    }
    return encodeURIComponent(restBase);
}
function buildUrl(wpUrl, restBase, query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v === undefined)
            continue;
        if (Array.isArray(v)) {
            if (v.length === 0)
                continue;
            params.set(k, v.join(","));
        }
        else {
            params.set(k, String(v));
        }
    }
    const qs = params.toString();
    return `${restRoot(wpUrl)}/${encodeRestBase(restBase)}${qs ? `?${qs}` : ""}`;
}
function applyOrderBy(query, orderBy) {
    if (!orderBy)
        return;
    if (orderBy === "date" || orderBy === "menu_order") {
        query.orderby = orderBy;
        return;
    }
    if (orderBy.startsWith("acf.")) {
        const key = orderBy.slice("acf.".length);
        if (key.length > 0) {
            query.orderby = "meta_value";
            query.meta_key = key;
        }
    }
}
function resolveCallOptions(opts) {
    return {
        timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        headers: { Accept: "application/json", ...(opts.headers ?? {}) },
        fetchImpl: opts.fetch ?? fetch,
    };
}
async function callJson(url, call) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), call.timeoutMs);
    let resp;
    try {
        resp = await call.fetchImpl(url, {
            method: "GET",
            headers: call.headers,
            signal: ac.signal,
        });
    }
    catch (err) {
        if (err?.name === "AbortError") {
            throw new AstroSectionsFetchError(`WP REST request timed out after ${call.timeoutMs}ms`, { url, cause: err });
        }
        throw new AstroSectionsFetchError(`WP REST fetch failed: ${err.message ?? String(err)}`, { url, cause: err });
    }
    finally {
        clearTimeout(timer);
    }
    // 404 on a single-post lookup is benign; bubble status up so the caller can
    // decide. Everything else non-2xx throws.
    if (!resp.ok && resp.status !== 404) {
        let detail = "";
        try {
            const text = await resp.text();
            detail = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        }
        catch {
            // ignore body-read errors
        }
        throw new AstroSectionsFetchError(`WP REST ${resp.status} ${resp.statusText} for ${url}${detail ? ` — ${detail}` : ""}`, { status: resp.status, url });
    }
    if (resp.status === 404)
        return { status: 404, body: null };
    let body;
    try {
        body = (await resp.json());
    }
    catch (err) {
        throw new AstroSectionsFetchError(`WP REST returned non-JSON body for ${url}`, { status: resp.status, url, cause: err });
    }
    return { status: resp.status, body };
}
// ---------- Public surface ----------
/**
 * Fetch a list of posts from a post type's REST endpoint. Returns `[]` when
 * the response is an empty list. Throws on any non-2xx (404 on a list
 * endpoint is treated as "post type not registered" → throw).
 */
export async function fetchCollection(restBase, params) {
    const perPage = Math.min(Math.max(params.perPage ?? 10, 1), WP_PER_PAGE_MAX);
    const page = Math.max(params.page ?? 1, 1);
    const order = params.order ?? "desc";
    const embed = params.embedFeaturedMedia !== false;
    const query = {
        per_page: perPage,
        page,
        order,
    };
    applyOrderBy(query, params.orderBy);
    if (params.search)
        query.search = params.search;
    if (embed)
        query._embed = "wp:featuredmedia";
    const url = buildUrl(params.wpUrl, restBase, query);
    const call = resolveCallOptions(params);
    // 404 on a list endpoint → post type not registered. Surface clearly.
    const { status, body } = await callJson(url, call);
    if (status === 404) {
        throw new AstroSectionsFetchError(`WP REST post type '${restBase}' not found at ${url}`, { status: 404, url });
    }
    if (!Array.isArray(body)) {
        throw new AstroSectionsFetchError(`WP REST collection response was not an array`, { status, url });
    }
    return body;
}
/**
 * Fetch a single post from a post type by slug. Returns `null` when no post
 * matches the slug. Includes `_embed=wp:featuredmedia` so the resolver can
 * find the featured image without an extra round-trip.
 */
export async function fetchPost(restBase, slug, options) {
    if (typeof slug !== "string" || slug.length === 0) {
        throw new AstroSectionsFetchError("slug is required", { url: "" });
    }
    const url = buildUrl(options.wpUrl, restBase, {
        slug,
        per_page: 1,
        _embed: "wp:featuredmedia",
    });
    const call = resolveCallOptions(options);
    const { status, body } = await callJson(url, call);
    if (status === 404)
        return null;
    if (!Array.isArray(body)) {
        throw new AstroSectionsFetchError(`WP REST post lookup response was not an array`, { status, url });
    }
    if (body.length === 0)
        return null;
    return body[0];
}
/**
 * Fetch a batch of media attachments by id. De-duplicates the input set and
 * preserves caller order via `orderby=include`. Returns `[]` for an empty
 * input. Throws if the deduped set exceeds the WP REST `per_page` cap (100).
 */
export async function fetchMediaBatch(ids, options) {
    const unique = uniquePositiveInts(ids);
    if (unique.length === 0)
        return [];
    if (unique.length > WP_PER_PAGE_MAX) {
        throw new AstroSectionsFetchError(`fetchMediaBatch: ${unique.length} ids exceeds WP REST per_page cap of ${WP_PER_PAGE_MAX}; chunk the input`, { url: "" });
    }
    const url = buildUrl(options.wpUrl, "media", {
        include: unique,
        per_page: unique.length,
        orderby: "include",
    });
    const call = resolveCallOptions(options);
    const { status, body } = await callJson(url, call);
    if (status === 404 || !Array.isArray(body))
        return [];
    return body;
}
/**
 * Fetch a batch of related posts by id from a single post type. Same dedupe
 * + order semantics as `fetchMediaBatch`. Used by `<RelatedItems>` after the
 * resolver pulls an id list out of an ACF relationship field.
 */
export async function fetchRelatedBatch(restBase, ids, options) {
    const unique = uniquePositiveInts(ids);
    if (unique.length === 0)
        return [];
    if (unique.length > WP_PER_PAGE_MAX) {
        throw new AstroSectionsFetchError(`fetchRelatedBatch: ${unique.length} ids exceeds WP REST per_page cap of ${WP_PER_PAGE_MAX}; chunk the input`, { url: "" });
    }
    const url = buildUrl(options.wpUrl, restBase, {
        include: unique,
        per_page: unique.length,
        orderby: "include",
        _embed: "wp:featuredmedia",
    });
    const call = resolveCallOptions(options);
    const { status, body } = await callJson(url, call);
    if (status === 404 || !Array.isArray(body))
        return [];
    return body;
}
// ---------- Helpers ----------
function uniquePositiveInts(ids) {
    if (!Array.isArray(ids))
        return [];
    const seen = new Set();
    const out = [];
    for (const id of ids) {
        if (typeof id !== "number" || !Number.isInteger(id) || id <= 0)
            continue;
        if (seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
/**
 * Fold a batch of fetched media into each post's
 * `_embedded["wp:featuredmedia"]` so `asImageUrl(post, id)` resolves
 * uniformly — for both featured images returned by `_embed` and ACF gallery
 * / image-field attachments fetched separately.
 *
 * Pure: returns new post objects, leaves the input untouched.
 */
export function attachMediaToPosts(posts, media) {
    if (!Array.isArray(posts) || posts.length === 0)
        return posts;
    if (!Array.isArray(media) || media.length === 0)
        return posts;
    const byId = new Map();
    for (const m of media) {
        if (m && typeof m.id === "number")
            byId.set(m.id, m);
    }
    if (byId.size === 0)
        return posts;
    return posts.map((post) => {
        const featured = post._embedded?.["wp:featuredmedia"] ?? [];
        const present = new Set(featured.map((m) => m.id));
        const additions = [];
        for (const [id, m] of byId) {
            if (!present.has(id))
                additions.push(m);
        }
        if (additions.length === 0)
            return post;
        return {
            ...post,
            _embedded: {
                ...(post._embedded ?? {}),
                "wp:featuredmedia": [...featured, ...additions],
            },
        };
    });
}
/**
 * Walk a post + a list of `FieldPath`s, return the set of attachment IDs
 * that are referenced but NOT yet present in `post._embedded["wp:featuredmedia"]`.
 * Consumers pass the result to `fetchMediaBatch` to fill the gap in one round-trip.
 *
 * Tolerant: paths that resolve to non-attachment values are skipped silently;
 * this is a "give me the IDs you can find" helper, not a validator.
 */
export function collectMissingMediaIds(posts, paths) {
    if (!Array.isArray(posts) || posts.length === 0)
        return [];
    if (!Array.isArray(paths) || paths.length === 0)
        return [];
    const seen = new Set();
    for (const post of posts) {
        const present = new Set((post._embedded?.["wp:featuredmedia"] ?? [])
            .map((m) => (typeof m.id === "number" ? m.id : null))
            .filter((id) => id != null));
        for (const path of paths) {
            const v = readAtPath(post, path);
            collectIds(v, present, seen);
        }
    }
    return [...seen];
}
function readAtPath(post, path) {
    // Light-weight inline walk — mirror of resolver's `walk` semantics, kept
    // local to avoid a circular dep on resolver.ts.
    if (typeof path !== "string" || path.length === 0)
        return null;
    let cur = post;
    let i = 0;
    let buf = "";
    while (i <= path.length) {
        const ch = i < path.length ? path[i] : null;
        if (ch === "." || ch === "[" || ch === null) {
            if (buf.length > 0) {
                if (cur === null || typeof cur !== "object" || Array.isArray(cur))
                    return null;
                cur = cur[buf];
                buf = "";
            }
            if (ch === "[") {
                const close = path.indexOf("]", i);
                if (close < 0)
                    return null;
                const inside = path.slice(i + 1, close);
                if (!/^\d+$/.test(inside))
                    return null;
                const idx = Number(inside);
                if (!Array.isArray(cur) || idx >= cur.length)
                    return null;
                cur = cur[idx];
                i = close + 1;
                if (i < path.length && path[i] === ".")
                    i++;
                continue;
            }
            i++;
            continue;
        }
        buf += ch;
        i++;
    }
    return cur ?? null;
}
function collectIds(v, present, out) {
    if (v == null)
        return;
    if (typeof v === "number" && Number.isInteger(v) && v > 0) {
        if (!present.has(v))
            out.add(v);
        return;
    }
    if (Array.isArray(v)) {
        for (const item of v)
            collectIds(item, present, out);
        return;
    }
    if (typeof v === "object" && "id" in v) {
        const id = v.id;
        if (typeof id === "number" && Number.isInteger(id) && id > 0 && !present.has(id)) {
            out.add(id);
        }
    }
}
//# sourceMappingURL=fetch.js.map