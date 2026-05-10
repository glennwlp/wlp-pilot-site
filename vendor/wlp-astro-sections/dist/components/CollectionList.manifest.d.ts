import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
export declare const propsSchema: z.ZodObject<{
    postType: z.ZodString;
    wpUrl: z.ZodURL;
    limit: z.ZodOptional<z.ZodNumber>;
    orderBy: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"date">, z.ZodLiteral<"menu_order">, z.ZodString]>>;
    orderDir: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    mapping: z.ZodObject<{
        image: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        badge: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        href: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=CollectionList.manifest.d.ts.map