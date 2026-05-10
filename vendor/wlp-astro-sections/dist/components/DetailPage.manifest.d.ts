import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
export declare const propsSchema: z.ZodObject<{
    postType: z.ZodString;
    wpUrl: z.ZodURL;
    slug: z.ZodString;
    mapping: z.ZodObject<{
        hero: z.ZodObject<{
            image: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
            subtitle: z.ZodOptional<z.ZodString>;
            badge: z.ZodOptional<z.ZodString>;
            href: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        body: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=DetailPage.manifest.d.ts.map