# @whitelabelpress/astro-sections

Schema-driven Astro section primitives for rendering any WordPress post type. Pairs with the WhitelabelPRESS portal's chat agent: **the dev installs this package once, the agent fills in `{ postType, mapping, variant }` for any CPT** without writing fetch loops.

Status: **Phase 22, Slice 22B — scaffold.** This is the starter shape; only `<CollectionGrid>` is stubbed for review. The full slice ships `<CollectionGrid>`, `<CollectionList>`, `<DetailPage>`, `<MediaGallery>`, `<RelatedItems>`, and `<KeyValueTable>` plus the batched fetch helpers.

## Install

```sh
pnpm add @whitelabelpress/astro-sections
```

## The contract

- **Layout primitives** (e.g. `<CollectionGrid>`) don't know what a "property" or "team member" is. They render slot-based cards from any post type.
- **`mapping` prop** tells a primitive which path on each post becomes which slot. Paths use a simple JSONPath-ish syntax: `title.rendered`, `acf.gallery[0]`, `acf.testimonials[3].quote`, `meta._wp_some_key`.
- **`resolvePath`** never throws. A bad path returns `null` and the slot's empty-state branch renders. A bad mapping shows an empty card, never a broken page.
- **`data-wlp-source` attributes** are emitted on every binding so the WhitelabelPRESS direct-edit picker works on rendered cards out of the box.

## Example

```astro
---
import CollectionGrid from "@whitelabelpress/astro-sections/components/CollectionGrid.astro";
---

<CollectionGrid
  postType="property"
  wpUrl="https://example.com"
  limit={10}
  orderBy="acf.listing_price"
  orderDir="desc"
  mapping={{
    image: "acf.gallery[0]",
    title: "title.rendered",
    badge: "acf.status",
    body:  "acf.short_description",
  }}
  variant="card-photo-overlay"
/>
```

## Adding a tenant-specific primitive

Drop an `.astro` file under `src/sections/<Name>.astro` in the consuming repo, export a `manifest`, and re-export it from `src/sections/manifest.ts`. The agent picks it up the same way it picks up package primitives — no portal change required.
