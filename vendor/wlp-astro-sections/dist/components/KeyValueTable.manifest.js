import { z } from "zod";
export const manifest = {
    name: "KeyValueTable",
    description: "Flat label / value table for a single post. Rows carry a field path + optional format hint (text / number / currency / date). One source-post round-trip.",
    requiresPostType: true,
    slots: [
        // The whole shape is encoded as a single repeater-flavored slot — the
        // agent configures it via the structured `rows` prop, not per-slot.
        {
            key: "rows",
            label: "Rows (label + field + format)",
            accepts: ["text", "number", "date", "list"],
            required: true,
            allowsRepeater: true,
        },
    ],
    // No layout variants — KeyValueTable is a single shape (label-left,
    // value-right). Tenants restyle via `.wlp-keyvalue*` class hooks.
};
export const propsSchema = z.object({
    postType: z.string().min(1),
    wpUrl: z.url(),
    postId: z.number().int().positive(),
    rows: z
        .array(z.object({
        label: z.string().min(1),
        field: z.string().min(1),
        format: z.enum(["text", "number", "currency", "date"]).optional(),
    }))
        .min(1),
    locale: z.string().optional(),
    currency: z.string().optional(),
    emptyCell: z.string().optional(),
    emptyText: z.string().optional(),
});
//# sourceMappingURL=KeyValueTable.manifest.js.map