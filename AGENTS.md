# AGENTS.md

> **Canonical reference: [`CLAUDE.md`](CLAUDE.md)**
> This file mirrors CLAUDE.md for non-Claude agents. When updating either file, keep both in sync.

## Self-Management

- **Keep this file under 200 lines.** Move detailed references to `docs/architecture/` and link from here.
- When you make an architectural decision or discover a pattern worth preserving, update this file and CLAUDE.md.
- When a documented pattern becomes outdated, remove or correct it immediately.
- Do not duplicate information that already lives in config files — reference them instead.
- Periodically audit linked docs; delete any that no longer reflect the codebase.

## Project Overview

**Stack:** SvelteKit 2 + Svelte 5 + TypeScript + Tailwind CSS 3 + mdsvex
**Output:** Static site via `@sveltejs/adapter-static` → Firebase Hosting
**Package manager:** pnpm (run commands from `site/`)

| Directory | Purpose |
|-----------|---------|
| `site/src/` | Application code (components, routes, utils) |
| `site/content/` | Markdown content (blog, projects) + YAML (resume variants) |
| `site/functions/` | Firebase Functions (separate project, excluded from lint) |
| `site/scripts/` | Standalone Node validation scripts (excluded from lint) |
| `site/static/` | Static assets served as-is |

## Architecture Decisions

### Why Tailwind CSS

1. **Theming via CSS custom properties** — Color system driven by CSS variables (`--color-*`) in `site/src/lib/styles/app.css`. Tailwind `skin-*` utilities map to these via `withOpacity()` in `tailwind.config.cjs`, enabling three themes without config changes.
2. **Utility-first consistency** — Styles colocated with markup, no naming debates.
3. **Prose plugin** — `@tailwindcss/typography` for markdown content with theme-aware colors (customized in `tailwind.config.cjs`).
4. **Small bundle** — PurgeCSS built in; only used classes ship.

**Rule:** Always use `skin-*` classes for theme-aware colors. Never hardcode hex values. Use `terminal-*` only for the fixed terminal aesthetic.

### Theming System

> Detail: [`docs/architecture/theming.md`](docs/architecture/theming.md)

- **Three themes:** light (default), dark, catppuccin — CSS custom properties in `site/src/lib/styles/app.css`
- **Detection:** Inline script in `app.html` before hydration (localStorage → `prefers-color-scheme`)
- **Runtime toggle:** `ThemeToggle.svelte` cycles themes, persists to localStorage
- **Tailwind:** `skin-*` colors support opacity modifiers. `darkMode: ['class']` — `html.dark` activates dark/catppuccin
- **Scanlines overlay:** Terminal-style effect in `app.css`, fixed position, pointer-events: none

### Component Conventions

- **Svelte 5 syntax** is standard: `$state()`, `$props()`, `$effect()`, `$derived()`, `{@render children()}`
- Legacy Svelte 4 (`export let`, `$:`) exists in some components — migrate when touching, don't refactor unprompted
- **Props:** `interface Props` + `let { prop } = $props()`
- **Icons:** `lucide-svelte` exclusively. Import individual icons.
- **Scoped styles:** `<style>` blocks. `:global()` only for styling rendered HTML (markdown output).

### Content System

- **Markdown** in `content/blog/` and `content/projects/` with YAML frontmatter (`ContentMetadata` in `src/lib/types.ts`)
- **Loading:** `import.meta.glob` in `+page.server.ts`, sorted by date descending
- **Rendering:** mdsvex with `PostLayout.svelte` as default layout
- **Resume data:** YAML files loaded with `js-yaml` — three variants (leader, ops, builder)
- **Quick Actions:** Static + dynamic content via `content-loader.ts`

### Variant System

Three resume variants: **leader** (default), **ops**, **builder**.

- Canonical paths: `/resume/`, `/ops/resume/`, `/builder/resume/`
- Other pages: query param `?v=ops`
- Utility: `src/lib/utils/variantLink.ts`
- Keep core info (contact, education, certificates) synced across all variant YAML files

### Static-First / Prerendering

This is a **statically generated site**. All pages are prerendered at build time via `@sveltejs/adapter-static`.

- Every `+page.server.ts` should export `export const prerender = true`
- Server-side logic (load functions) runs at **build time**, not at request time
- Do not introduce SSR-only patterns (cookies, request headers, dynamic server responses) in page routes
- API routes under `src/routes/api/` are the exception — they proxy to Firebase Functions at runtime
- `import.meta.glob` with `eager: true` is the standard pattern for loading content at build time
- If a feature requires runtime server logic, it belongs in Firebase Functions (`site/functions/`), not in SvelteKit routes

### SEO & Structured Data

- `SEO.svelte` required on every page — `title` and `description` are mandatory
- JSON-LD: use `${"script"}` workaround to avoid ESLint parser errors
- Outputs: Open Graph, Twitter Card, canonical link, keywords

## Dev Server

> [!IMPORTANT]
> **ALWAYS** check for a running dev server before starting a new one.

- HMR handles code changes — only restart for `vite.config.ts`, `svelte.config.js`, or `.env`
- Run from `site/`: `pnpm dev`

## Formatting & Linting

- **Prettier:** 2-space indent, double quotes, no trailing commas, 100 char width
- **ESLint:** Flat config — TypeScript + Svelte + Prettier compat
- `@typescript-eslint/no-explicit-any` is `warn` — reduce, don't add new ones
- `svelte/no-at-html-tags` is `off` (intentional `{@html}` usage)

## Testing & Validation

| Command | Purpose |
|---------|---------|
| `pnpm run validate` | Full pipeline: check + build + all tests |
| `pnpm run check` | svelte-check + TypeScript |
| `pnpm run lint` | ESLint |
| `pnpm run test:e2e` | Playwright end-to-end |
| `pnpm run test:ui` | UI validation |
| `pnpm run test:resumes` | Resume YAML validation |
| `pnpm run test:posthog` | PostHog integration |
| `pnpm run test:ai` | AI feature validation |

### CI/CD Debugging

```bash
gh run view <run-id>          # View status
gh run watch <run-id>         # Watch live
gh run view <run-id> --log    # View logs
```

## Known Gotchas

- **Windows/Playwright:** `gracefulShutdown` needs `SIGINT`, not `SIGTERM`
- **`<script>` in `{@html}`:** Use `${"script"}` variable workaround
- **Pre-existing svelte-check warnings:** `@apply` CSS, deprecated `<slot>`, a11y — known, don't chase
- **Trailing slashes:** All routes use trailing slashes (`trailingSlash: 'always'`)
- **PostHog paths:** `paths.relative: false` required in svelte.config.js for session replay
