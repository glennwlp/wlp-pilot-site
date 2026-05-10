// Public entry. The .astro components are NOT re-exported here — they're
// shipped as raw files under `components/` and consumed via the package
// `exports` map (e.g. `@whitelabelpress/astro-sections/components/CollectionGrid.astro`).
//
// What does live here: the resolver, the type guards, the shared types, and
// the aggregated manifest list — everything the consuming Astro frontmatter
// (and Slice 22C's `insert_section` tool) needs at compile and runtime.
export { parsePath, resolvePath, asString, asNumber, asImageId, asImageUrl, asPostIds, asArray, } from "./resolver.js";
export { fetchCollection, fetchPost, fetchMediaBatch, fetchRelatedBatch, attachMediaToPosts, collectMissingMediaIds, AstroSectionsFetchError, } from "./fetch.js";
export { getStaticPathsFor } from "./static-paths.js";
export { manifests, propsSchemas } from "./manifests.js";
//# sourceMappingURL=index.js.map