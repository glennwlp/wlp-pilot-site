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
    // Variant CSS for the layout switch (CollectionGrid vs. CollectionList) is
    // a back-half-of-22B concern — we only ship the grid renderer for now.
    variants: ["grid"],
};
//# sourceMappingURL=RelatedItems.manifest.js.map