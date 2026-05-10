import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
/**
 * Runtime schema for `<CollectionGrid>` props. Validated by the
 * `insert_section` agent tool (Slice 22C) before the JSX is serialized.
 *
 * The shape mirrors the .astro file's `Props` interface — a Zod issue here
 * means the agent passed a malformed `props` object and the model can read
 * the issue path + message to retry.
 */
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
    variant: z.ZodOptional<z.ZodEnum<{
        "card-photo-overlay": "card-photo-overlay";
        "card-side": "card-side";
        "card-stacked": "card-stacked";
    }>>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=CollectionGrid.manifest.d.ts.map