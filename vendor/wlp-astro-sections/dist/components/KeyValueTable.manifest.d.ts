import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
export declare const propsSchema: z.ZodObject<{
    postType: z.ZodString;
    wpUrl: z.ZodURL;
    postId: z.ZodNumber;
    rows: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        field: z.ZodString;
        format: z.ZodOptional<z.ZodEnum<{
            number: "number";
            date: "date";
            text: "text";
            currency: "currency";
        }>>;
    }, z.core.$strip>>;
    locale: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    emptyCell: z.ZodOptional<z.ZodString>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=KeyValueTable.manifest.d.ts.map