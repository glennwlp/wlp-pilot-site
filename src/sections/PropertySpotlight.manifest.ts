import type { SectionManifest } from '@whitelabelpress/astro-sections';

/**
 * Tenant-specific section manifest for PropertySpotlight. The portal's
 * `list_section_catalog` tool reads `src/sections/manifest.ts`, follows
 * this import, and surfaces the manifest with `source: "tenant"` — no
 * portal change required for new tenant primitives.
 *
 * Only literal values here: the loader's strict literal evaluator rejects
 * Identifier references, function calls, and template-literal expressions
 * to keep the surface narrow.
 */
export const manifest: SectionManifest = {
  name: 'PropertySpotlight',
  description:
    'Single-post hero spotlight with side-by-side image and copy. Pilot-specific layout for the property CPT.',
  requiresPostType: true,
  slots: [
    { key: 'image', label: 'Image', accepts: ['image', 'gallery'], required: false },
    { key: 'title', label: 'Title', accepts: ['text'], required: true },
    { key: 'badge', label: 'Badge / price', accepts: ['text', 'number'], required: false },
    { key: 'body', label: 'Body', accepts: ['text', 'html'], required: false },
    { key: 'href', label: 'Link target', accepts: ['text'], required: false },
  ],
};
