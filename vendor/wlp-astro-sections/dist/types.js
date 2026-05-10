// Public types shared by the resolver, the manifests, and (at the consumer's
// build) the .astro components.
//
// FieldPath is intentionally `string` — paths are user-supplied at agent time
// and validated at runtime by `resolvePath`. The `insert_section` agent tool
// (Slice 22C) validates against the primitive's Zod schema; this file does
// not own that validation.
export {};
//# sourceMappingURL=types.js.map