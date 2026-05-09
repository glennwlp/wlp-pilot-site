<!-- BEGIN:wlp-agent-rules -->
# WhitelabelPRESS — Editing conventions

This site is connected to **WhitelabelPRESS** (WLP pilot site editing portal at `app.whitelabelpress.com`). The conventions below let the AI editor make focused, safe changes without breaking the build.

If you (a human developer) are working on this repo with another AI tool, please preserve these conventions — they are how the editing portal stays reliable.

## What this site is

- **Stack:** Astro 6 + Tailwind v4.
- **Default branch:** `main`.
- **Publish mode:** `gated` — an owner approves every PR before it merges.

## Files the agent may edit

The portal tenant is configured with `allowed_paths = ["src/", "public/"]`. Within those, the agent will:

- Edit `src/components/**/*.astro` for component copy and structure.
- Edit `src/pages/**/*.astro` for routing/page-level copy and frontmatter.
- Edit `src/layouts/**/*.astro` for layout adjustments when explicitly asked.
- Edit `src/styles/**/*.{css,scss}` for design changes when explicitly asked.
- Add new files under `public/` (typically images committed via the chat composer).

## Content-constant pattern (used by the picker)

Each section component declares its editable copy as a frontmatter `const` named `<COMPONENT>_CONTENT` and reads from it via JSX expressions. The `@whitelabelpress/astro-integration` Vite plugin auto-emits a `data-wlp-source="astro:<file>:<CONST>.<field>"` attribute on the wrapping tag of each markup-expression child whose value is a member chain rooted at the const. That attribute is what lets the editor click on the element in the preview iframe and open an inline editor for that exact field.

Example (`src/components/Hero.astro`) — no `data-wlp-source` written by hand:

```astro
---
const HERO_CONTENT = {
	eyebrow: "WhitelabelPRESS pilot",
	headline: "Built for editors who don't want to wait on developers",
	body: "...",
};
---
<h1>{HERO_CONTENT.headline}</h1>
<p>{HERO_CONTENT.body}</p>
```

The build output picks up `data-wlp-source="astro:src/components/Hero.astro:HERO_CONTENT.headline"` on the `<h1>` automatically.

### When hand-annotation is still required

The auto-emitter only resolves expressions whose member chain is rooted at a frontmatter `const` in the same file. Two patterns fall outside that:

1. **`.map()` loops** — closure variables like `item.title` inside `{items.map((item, i) => ...)}` aren't a member chain rooted at the const. Hand-annotate using a template-literal `data-wlp-source` with the index:

   ```astro
   {FEATURES_CONTENT.items.map((item, i) => (
   	<h3 data-wlp-source={`astro:src/components/Features.astro:FEATURES_CONTENT.items[${i}].title`}>
   		{item.title}
   	</h3>
   ))}
   ```

2. **Imported constants** — only frontmatter `const`s declared in the same `.astro` file are picked up. If you want to share copy across files, hand-annotate or move the values inline.

A manual `data-wlp-source` always wins — when present, the auto-emitter skips that element. Mixing auto + hand on the same page is fine.

### Conventions

- One `*_CONTENT` const per component, declared at the top of the frontmatter.
- Field names are lowercase camelCase (`headline`, `ctaPrimaryHref`).
- New section component? Add a `*_CONTENT` const, read its fields via JSX expressions, and the integration handles the rest. Only fall back to hand-annotation for `.map()` rows or other patterns the auto-emitter can't see.

## Files the agent will never edit

These are blocked at the tool layer — even a prompt-injected request can't override them:

- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`, `*.lock`, `*.lockb`
- `astro.config.mjs`, `astro.config.ts`
- `tsconfig.json`
- Any dotfile or dotdir (`.env*`, `.github/`, `.gitignore`, `.vscode/`, etc.)
- Anything under `node_modules/`

**Don't ask the agent to:** install or upgrade dependencies, change build configuration, edit CI workflows, modify environment variables, run database migrations, or touch authentication code. If you need any of those, open a PR yourself or contact the WhitelabelPRESS team.

## Images

- **Where they live:** `public/img/` (created on first upload).
- **Naming:** lowercase, kebab-case, descriptive — `hero-portrait.jpg`, `team-jane-doe.webp`. The agent picks a sensible name from the user's description if they don't specify one.
- **Formats:** `image/png`, `image/jpeg`, `image/webp`. SVG is not supported via the chat composer (it's blocked client-side because of the embedded-script risk).
- **Size cap:** 5 MB per upload (enforced server-side by the portal).
- **References from components:** absolute paths from `public/`, e.g. `<img src="/img/hero-portrait.jpg" />`. The agent updates the reference in the same PR as the binary.

## Vercel preview access (required for the inline iframe)

The portal renders an inline iframe of each PR's Vercel preview deploy in the chat — it's how the editor verifies the change before merging. For that iframe to load, the preview must be:

1. **Publicly reachable** (no `Deployment Protection` SSO wall on previews). On Vercel, this is set in **Project Settings → Deployment Protection** — set to **"Standard Protection: Disabled"** for preview environments.
2. **Framable from `app.whitelabelpress.com`**. This repo ships a `vercel.json` with `Content-Security-Policy: frame-ancestors https://app.whitelabelpress.com http://localhost:3000 'self'` that handles this. Don't strip the header without updating the portal config.

If neither condition is met, the chat falls back to a "Open preview ↗" CTA — the URL still works, just not embedded.

## Branch & PR conventions

- The agent opens one PR per conversation against `main` from a branch named `wlp-edit/<conversation-id>-<timestamp>`.
- PR titles are written for the client to read, not for engineers (e.g. *"Update hero headline and CTA"*, not *"refactor: update Hero.astro"*).
- The PR body explains the change in plain English plus a short technical note for the reviewer.
- **Don't rebase or force-push** the agent's branches mid-flight — the portal tracks PR status via webhook, and a force-push will desync the conversation's status pill until the next state transition.
- Merging happens through the portal (an owner clicks **Merge** in chat), not by clicking the green button on GitHub. If you do merge from GitHub directly, the audit log will record it as a manual merge by your GitHub user.

## When the agent says "I can't do that"

- **"That file is on the blocklist"** — see the never-edit list above. Ask a developer instead.
- **"That path is outside allowed paths"** — the request targets a location the agent isn't permitted to touch on this tenant. Either rephrase the request or, if the location should be editable, contact WhitelabelPRESS to widen the allowlist.
- **"Credits exhausted"** — the project's credit wallet is empty. The owner can purchase a top-up in tenant settings.
- **"Project disabled"** — administrative pause (non-payment, fraud review, or owner-requested). Contact WhitelabelPRESS.

<!-- END:wlp-agent-rules -->
