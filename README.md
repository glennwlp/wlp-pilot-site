# wlp-pilot-site

WhitelabelPRESS pilot site — Astro 6 + Tailwind v4. Connected to the WLP editing portal at `app.whitelabelpress.com` for non-developer content edits via chat.

## Local dev

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # production build
pnpm preview      # serve the build locally
```

## Editing conventions

See [`AGENTS.md`](./AGENTS.md). It documents what the WLP agent (and any other AI coding tool) is allowed to edit, the security blocklist, image conventions, and PR/branch rules.

## Vercel preview embedding

`vercel.json` ships a `Content-Security-Policy: frame-ancestors` header so PR previews load inside the WLP editor's iframe. Don't strip it.

For the iframe embed to actually render, also disable **Deployment Protection** for preview environments in the Vercel project settings, or generate a Bypass Token.
