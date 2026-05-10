import { z } from "zod";
export const manifest = {
    name: "DetailPage",
    description: "Single-post hero + body for a per-CPT-entry route. Pairs with getStaticPathsFor(restBase) to generate one route per post at build time.",
    requiresPostType: true,
    slots: [
        { key: "image", label: "Hero image", accepts: ["image", "gallery"], required: false },
        { key: "title", label: "Title", accepts: ["text"], required: true },
        { key: "subtitle", label: "Subtitle / lede", accepts: ["text"], required: false },
        { key: "badge", label: "Badge / price", accepts: ["text", "number"], required: false },
        { key: "body", label: "Body", accepts: ["text", "html"], required: false },
    ],
    // No card variants — DetailPage is a single layout. Tenants restyle via
    // .wlp-detail* class hooks.
};
export const propsSchema = z.object({
    postType: z.string().min(1),
    wpUrl: z.url(),
    slug: z.string().min(1),
    mapping: z.object({
        hero: z.object({
            image: z.string().optional(),
            title: z.string().min(1),
            subtitle: z.string().optional(),
            badge: z.string().optional(),
            href: z.string().optional(),
        }),
        body: z.string().optional(),
    }),
    emptyText: z.string().optional(),
});
//# sourceMappingURL=DetailPage.manifest.js.map