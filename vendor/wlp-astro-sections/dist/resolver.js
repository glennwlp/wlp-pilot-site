// Pure field-path resolver + type guards. Never throws at resolve time:
// a bad path returns `null` and the slot's empty-state branch renders.
//
// The parser is exposed separately so Slice 22C's `insert_section` tool can
// validate user-supplied paths up front (parser DOES throw on malformed
// input — it's a developer-visible error, not a data-shape miss).
/**
 * Tokenise a FieldPath into walk steps. Throws on malformed input.
 */
export function parsePath(path) {
    if (typeof path !== "string" || path.length === 0) {
        throw new Error(`parsePath: empty path`);
    }
    const out = [];
    let buf = "";
    let i = 0;
    while (i < path.length) {
        const ch = path[i];
        if (ch === ".") {
            if (buf.length === 0) {
                // Leading dot or `..` — ambiguous.
                throw new Error(`parsePath: empty key segment in '${path}' at offset ${i}`);
            }
            out.push({ kind: "key", name: buf });
            buf = "";
            i++;
            continue;
        }
        if (ch === "[") {
            if (buf.length > 0) {
                out.push({ kind: "key", name: buf });
                buf = "";
            }
            const close = path.indexOf("]", i);
            if (close < 0) {
                throw new Error(`parsePath: unterminated '[' in '${path}' at offset ${i}`);
            }
            const inside = path.slice(i + 1, close);
            if (!/^\d+$/.test(inside)) {
                throw new Error(`parsePath: index must be a non-negative integer, got '${inside}' in '${path}'`);
            }
            out.push({ kind: "index", value: Number(inside) });
            i = close + 1;
            // After ']' the next char must be '.' (separator before the next key),
            // '[' (another index), or end of path. Consume the separator dot here
            // so the main loop doesn't see it as a leading-dot / empty-key error.
            if (i < path.length) {
                if (path[i] === ".") {
                    i++;
                }
                else if (path[i] !== "[") {
                    throw new Error(`parsePath: expected '.' or '[' after ']' in '${path}' at offset ${i}`);
                }
            }
            continue;
        }
        if (ch === "]") {
            throw new Error(`parsePath: unmatched ']' in '${path}' at offset ${i}`);
        }
        buf += ch;
        i++;
    }
    if (buf.length > 0) {
        out.push({ kind: "key", name: buf });
    }
    if (out.length === 0) {
        throw new Error(`parsePath: empty path '${path}'`);
    }
    return out;
}
/**
 * Walk a parsed path against a post. Returns the value at the path, or `null`
 * on any miss / type mismatch. Never throws.
 */
function walk(post, steps) {
    let cur = post;
    for (const step of steps) {
        if (cur === null || cur === undefined)
            return null;
        if (step.kind === "key") {
            if (typeof cur !== "object" || Array.isArray(cur))
                return null;
            cur = cur[step.name];
        }
        else {
            if (!Array.isArray(cur))
                return null;
            if (step.value >= cur.length)
                return null;
            cur = cur[step.value];
        }
    }
    return cur ?? null;
}
/**
 * Resolve a FieldPath against a WpPost. Returns `null` on any miss, malformed
 * path, or type mismatch. Never throws.
 */
export function resolvePath(post, path) {
    let steps;
    try {
        steps = parsePath(path);
    }
    catch {
        return null;
    }
    return walk(post, steps);
}
// ---------- Type guards ----------
//
// Coerce the resolver's `unknown` return into the shape a primitive's slot
// expects. Each guard returns `null` when the value can't be coerced — same
// contract as `resolvePath`, so chaining stays soft.
export function asString(v) {
    if (typeof v === "string")
        return v;
    if (typeof v === "number" || typeof v === "boolean")
        return String(v);
    // WP `title` / `content` / `excerpt` are `{ rendered: string }`; if the
    // mapping points at the parent without `.rendered`, peel one level.
    if (v && typeof v === "object" && "rendered" in v) {
        const r = v.rendered;
        if (typeof r === "string")
            return r;
    }
    return null;
}
export function asNumber(v) {
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
        return Number(v);
    }
    return null;
}
/**
 * Coerce a WP attachment reference to an attachment ID. WP returns these as
 * raw numbers (core `featured_media`), as objects with `.id` (ACF
 * `return_format=object`), or as URL-form strings (rare). We accept the first
 * two; URL-form strings are handled by `asImageUrl` directly.
 */
export function asImageId(v) {
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (v && typeof v === "object" && "id" in v) {
        const id = v.id;
        if (typeof id === "number" && Number.isFinite(id))
            return id;
    }
    return null;
}
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
export function asImageUrl(post, v) {
    if (typeof v === "string")
        return v;
    if (v && typeof v === "object") {
        const obj = v;
        if (typeof obj.source_url === "string")
            return obj.source_url;
        if (typeof obj.url === "string")
            return obj.url;
    }
    const id = asImageId(v);
    if (id == null)
        return null;
    const embedded = post._embedded?.["wp:featuredmedia"] ?? [];
    for (const m of embedded) {
        if (m && m.id === id && typeof m.source_url === "string")
            return m.source_url;
    }
    return null;
}
/**
 * Coerce an ACF relationship field value to an array of post IDs. ACF
 * relationships return numbers when `return_format=id`, post objects when
 * `return_format=object`. We accept both shapes.
 */
export function asPostIds(v) {
    if (!Array.isArray(v))
        return null;
    const out = [];
    for (const item of v) {
        const id = asImageId(item);
        if (id == null)
            return null;
        out.push(id);
    }
    return out;
}
/**
 * Soft array guard. Returns `null` for non-arrays so a primitive's empty-
 * state branch can render without a runtime exception.
 */
export function asArray(v) {
    return Array.isArray(v) ? v : null;
}
//# sourceMappingURL=resolver.js.map