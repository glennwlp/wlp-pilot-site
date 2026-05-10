import { z } from "zod";
export const manifest = {
    name: "CollectionList",
    description: "Vertical/feed layout of cards rendered from any WordPress post type. Use for blogs, news, events. Configure each item's slots via the `mapping` prop.",
    requiresPostType: true,
    slots: [
        { key: "image", label: "Image", accepts: ["image", "gallery"], required: false },
        { key: "title", label: "Title", accepts: ["text"], required: true },
        { key: "badge", label: "Badge / tag", accepts: ["text"], required: false },
        { key: "body", label: "Body / excerpt", accepts: ["text", "html"], required: false },
        { key: "href", label: "Link target", accepts: ["text"], required: false },
    ],
    // No card variants — vertical-feed is a single layout. CSS hooks live on
    // `.wlp-collection-list__list` and `.wlp-feed-item`.
};
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
    emptyText: z.string().optional(),
});
//# sourceMappingURL=CollectionList.manifest.js.map