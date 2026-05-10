/**
 * A JSONPath-ish field path on a WordPress REST post.
 *
 * Examples:
 *   "title.rendered"
 *   "content.rendered"
 *   "link"
 *   "featured_media"
 *   "acf.headline"
 *   "acf.gallery[0]"
 *   "acf.testimonials[3].quote"
 *   "meta._wp_custom_key"
 */
export type FieldPath = string;
/**
 * The shape of a `/wp-json/wp/v2/<post-type>` entry as returned by core WP +
 * common ACF setups. Resolver only accesses paths that exist on a given post;
 * everything is optional because real responses vary by post type, plugin
 * mix, and `_embed` settings.
 */
export interface WpPost {
    id: number;
    slug?: string;
    link?: string;
    date?: string;
    modified?: string;
    status?: string;
    type?: string;
    title?: {
        rendered: string;
    } | string;
    content?: {
        rendered: string;
    } | string;
    excerpt?: {
        rendered: string;
    } | string;
    featured_media?: number;
    acf?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    _embedded?: {
        "wp:featuredmedia"?: Array<EmbeddedMedia>;
        "wp:term"?: Array<Array<{
            id: number;
            name: string;
            slug: string;
            taxonomy: string;
        }>>;
    };
    [key: string]: unknown;
}
export interface EmbeddedMedia {
    id: number;
    source_url?: string;
    alt_text?: string;
    media_details?: {
        sizes?: Record<string, {
            source_url?: string;
            width?: number;
            height?: number;
        }>;
    };
}
/**
 * What kind of value a primitive's slot accepts. The mapping heuristic in
 * Slice 22C uses this to score candidate paths against a slot.
 */
export type SlotKind = "text" | "html" | "image" | "gallery" | "relation" | "list" | "date" | "number";
export interface SlotDef {
    /** Mapping object key (e.g. "image", "title", "badge"). */
    key: string;
    /** Human label used by the chat mapping-confirmation UI. */
    label: string;
    /** Acceptable WP-side value kinds for this slot. */
    accepts: SlotKind[];
    /** Whether the slot must be mapped for the primitive to render meaningfully. */
    required: boolean;
    /**
     * Whether the slot can repeat — used by primitives that recurse over a
     * sub-mapping (e.g. `<MediaGallery>` over an ACF gallery field). Default
     * false (single value).
     */
    allowsRepeater?: boolean;
}
export interface SectionManifest {
    /** Component name as it appears in JSX (must match the .astro filename). */
    name: string;
    /** One-line description shown to the agent + editor when picking. */
    description: string;
    /**
     * True when the primitive needs a `postType` prop (i.e. it fetches from
     * WP). False for primitives that consume a post passed in via props
     * (e.g. `<KeyValueTable>` inside a `<DetailPage>`).
     */
    requiresPostType: boolean;
    slots: SlotDef[];
    /** Optional CSS variant names the primitive supports via `data-variant`. */
    variants?: string[];
}
/**
 * Generic mapping shape for collection primitives (`<CollectionGrid>`,
 * `<CollectionList>`). Each slot is a `FieldPath` resolved per post.
 *
 * Per-primitive mappings tighten this with required keys (e.g. `title` is
 * required on `<CollectionGrid>`).
 */
export interface CollectionMapping {
    image?: FieldPath;
    title: FieldPath;
    badge?: FieldPath;
    body?: FieldPath;
    href?: FieldPath;
    meta?: Record<string, FieldPath>;
}
//# sourceMappingURL=types.d.ts.map