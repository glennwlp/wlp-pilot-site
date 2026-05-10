/**
 * Tenant-local section catalog. Every tenant primitive's manifest gets
 * imported here so the portal's `list_section_catalog` tool surfaces it
 * to the agent without a portal change.
 *
 * Keep this list in sync as new `<Name>.manifest.ts` siblings are added.
 */

import type { SectionManifest } from '@whitelabelpress/astro-sections';
import { manifest as PropertySpotlight } from './PropertySpotlight.manifest';

export const manifests: SectionManifest[] = [PropertySpotlight];
