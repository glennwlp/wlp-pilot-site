import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
export declare const propsSchema: z.ZodObject<{
    postType: z.ZodString;
    wpUrl: z.ZodURL;
    postId: z.ZodNumber;
    field: z.ZodString;
    renderAs: z.ZodOptional<z.ZodEnum<{
        CollectionGrid: "CollectionGrid";
        CollectionList: "CollectionList";
    }>>;
    mapping: z.ZodObject<{
        image: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        badge: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        href: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>;
    limit: z.ZodOptional<z.ZodNumber>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=RelatedItems.manifest.d.ts.map