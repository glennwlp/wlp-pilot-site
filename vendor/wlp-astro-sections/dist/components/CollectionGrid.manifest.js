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
//# sourceMappingURL=CollectionGrid.manifest.js.map