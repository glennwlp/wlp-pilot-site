import { z } from "zod";
export const manifest = {
    name: "MediaGallery",
    description: "Grid of images rendered from an ACF gallery (or any image-array) field on a post. One source-post round-trip + one batched media fetch.",
    requiresPostType: true,
    slots: [
        {
            key: "field",
            label: "Gallery field path",
            accepts: ["gallery", "image", "list"],
            required: true,
            allowsRepeater: true,
        },
    ],
    variants: ["grid", "masonry", "lightbox"],
};
export const propsSchema = z.object({
    postType: z.string().min(1),
    wpUrl: z.url(),
    postId: z.number().int().positive(),
    field: z.string().min(1),
    altField: z.string().optional(),
    variant: z.enum(["grid", "masonry", "lightbox"]).optional(),
    limit: z.number().int().positive().max(100).optional(),
    emptyText: z.string().optional(),
});
//# sourceMappingURL=MediaGallery.manifest.js.map