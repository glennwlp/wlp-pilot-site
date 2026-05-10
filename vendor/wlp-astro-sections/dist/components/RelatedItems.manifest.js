import { z } from "zod";
export const manifest = {
    name: "RelatedItems",
    description: "Cards for posts referenced by an ACF relationship field on a source post. Configure the source post, relationship field path, and card slots via props.",
    requiresPostType: true,
    slots: [
        { key: "image", label: "Image", accepts: ["image", "gallery"], required: false },
        { key: "title", label: "Title", accepts: ["text"], required: true },
        { key: "badge", label: "Badge / tag", accepts: ["text"], required: false },
        { key: "body", label: "Body / excerpt", accepts: ["text", "html"], required: false },
        { key: "href", label: "Link target", accepts: ["text"], required: false },
    ],
    // Both renderAs branches now ship; the manifest's `variants` key is reused
    // to advertise the layout choice the agent must make.
    variants: ["CollectionGrid", "CollectionList"],
};
export const propsSchema = z.object({
    postType: z.string().min(1),
    wpUrl: z.url(),
    postId: z.number().int().positive(),
    field: z.string().min(1),
    renderAs: z.enum(["CollectionGrid", "CollectionList"]).optional(),
    mapping: z.object({
        image: z.string().optional(),
        title: z.string().min(1),
        badge: z.string().optional(),
        body: z.string().optional(),
        href: z.string().optional(),
        meta: z.record(z.string(), z.string()).optional(),
    }),
    limit: z.number().int().positive().max(100).optional(),
    emptyText: z.string().optional(),
});
//# sourceMappingURL=RelatedItems.manifest.js.map