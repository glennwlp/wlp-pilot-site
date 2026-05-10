// Aggregated manifest exports. Tenants re-export this from
// `src/sections/manifest.ts` (the convention documented in
// `docs/templates/AGENTS-client-template.md`) so the agent's
// `list_section_catalog` tool finds every available primitive in one read.
import { manifest as collectionGrid } from "./components/CollectionGrid.manifest.js";
// Slice 22B will append: collectionList, detailPage, mediaGallery,
// relatedItems, keyValueTable.
export const manifests = [collectionGrid];
//# sourceMappingURL=manifests.js.map