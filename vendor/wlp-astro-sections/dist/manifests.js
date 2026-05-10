// Aggregated manifest exports. Tenants re-export this from
// `src/sections/manifest.ts` (the convention documented in
// `docs/templates/AGENTS-client-template.md`) so the agent's
// `list_section_catalog` tool finds every available primitive in one read.
import { manifest as collectionGrid, propsSchema as collectionGridProps, } from "./components/CollectionGrid.manifest.js";
import { manifest as collectionList, propsSchema as collectionListProps, } from "./components/CollectionList.manifest.js";
import { manifest as relatedItems, propsSchema as relatedItemsProps, } from "./components/RelatedItems.manifest.js";
import { manifest as detailPage, propsSchema as detailPageProps, } from "./components/DetailPage.manifest.js";
import { manifest as mediaGallery, propsSchema as mediaGalleryProps, } from "./components/MediaGallery.manifest.js";
import { manifest as keyValueTable, propsSchema as keyValueTableProps, } from "./components/KeyValueTable.manifest.js";
// All six Slice 22B primitives shipped.
export const manifests = [
    collectionGrid,
    collectionList,
    relatedItems,
    detailPage,
    mediaGallery,
    keyValueTable,
];
/**
 * Per-primitive Zod schemas keyed by manifest `name`. Imported by
 * `lib/agent-tools.ts insert_section` (Slice 22C) to validate the agent's
 * `props` argument before the JSX is serialized into the target file.
 *
 * Schema-as-data, not schema-as-types — the agent tool needs the runtime
 * `parse` method, not just the type.
 */
export const propsSchemas = {
    CollectionGrid: collectionGridProps,
    CollectionList: collectionListProps,
    RelatedItems: relatedItemsProps,
    DetailPage: detailPageProps,
    MediaGallery: mediaGalleryProps,
    KeyValueTable: keyValueTableProps,
};
//# sourceMappingURL=manifests.js.map