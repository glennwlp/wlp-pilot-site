# @whitelabelpress/astro-integration

Astro integration for the WhitelabelPRESS portal. Two responsibilities:

1. **Build-time `data-wlp-source` emission** — a Vite plugin walks each `.astro`
   file's AST and tags every markup expression that reads from a content
   constant (e.g. `{HERO_CONTENT.headline}`) with a stable locator
   (`data-wlp-source="astro:src/components/Hero.astro:HERO_CONTENT.headline"`).
2. **Runtime overlay** — when the page is loaded with `?wlp=preview`, an
   overlay script attaches hover highlighting + click capture for any element
   carrying `data-wlp-source`, and posts `wlp:elementClicked` messages to the
   portal parent (origin-validated).

The portal uses these together to power direct-edit ("click element → edit in
side panel → save → PR") without invoking the AI agent.

## Install

```sh
pnpm add @whitelabelpress/astro-integration
```

In `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import wlp from "@whitelabelpress/astro-integration";

export default defineConfig({
  integrations: [wlp()],
});
```

## Status

Phase 15.5 Slice 1 — text editing only. Image/video swap (Slice 2) and the
right-click commenting menu (Phase 18) extend the same package.
