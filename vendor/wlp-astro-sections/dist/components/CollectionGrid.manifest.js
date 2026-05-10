import { z } from "zod";
export const manifest = {
    name: "CollectionGrid",
    description: "Grid of cards rendered from any WordPress post type. Configure each card slot via the `mapping` prop.",
    requiresPostType: true,
    slots: [
        { key: "image", label: "Image", accepts: ["image", "gallery"], required: false },
        { key: "title", label: "Title", accepts: ["text"], required: true },
        { key: "badge", label: "Badge / tag", accepts: ["text"], required: false },
        { key: "body", label: "Body / excerpt", accepts: ["text", "html"], required: false },
        { key: "href", label: "Link target", accepts: ["text"], required: false },
    ],
    variants: ["card-photo-overlay", "card-side", "card-stacked"],
};
/**
 * Runtime schema for `<CollectionGrid>` props. Validated by the
 * `insert_section` agent tool (Slice 22C) before the JSX is serialized.
 *
 * The shape mirrors the .astro file's `Props` interface — a Zod issue here
 * means the agent passed a malformed `props` object and the model can read
 * the issue path + message to retry.
 */
export const propsSchema = z.object({
    postType: z.string().min(1),
    wpUrl: z.url(),
    limit: z.number().int().positive().max(100).optional(),
    orderBy: z
        .union([z.literal("date"), z.literal("menu_order"), z.string().regex(/^acf\./)])
        .optional(),
    orderDir: z.enum(["asc", "desc"]).optional(),
    mapping: z.object({
        image: z.string().optional(),
        title: z.string().min(1),
        badge: z.string().optional(),
        body: z.string().optional(),
        href: z.string().optional(),
        meta: z.record(z.string(), z.string()).optional(),
    }),
    variant: z.enum(["card-photo-overlay", "card-side", "card-stacked"]).optional(),
    emptyText: z.string().optional(),
});
//# sourceMappingURL=CollectionGrid.manifest.js.map