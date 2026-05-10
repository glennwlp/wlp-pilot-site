import { z } from "zod";
import type { SectionManifest } from "../types.js";
export declare const manifest: SectionManifest;
export declare const propsSchema: z.ZodObject<{
    postType: z.ZodString;
    wpUrl: z.ZodURL;
    postId: z.ZodNumber;
    field: z.ZodString;
    altField: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodEnum<{
        grid: "grid";
        masonry: "masonry";
        lightbox: "lightbox";
    }>>;
    limit: z.ZodOptional<z.ZodNumber>;
    emptyText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=MediaGallery.manifest.d.ts.map