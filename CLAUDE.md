# CLAUDE.md

> **Source of truth for AI agents working in this codebase.**
> AGENTS.md mirrors this file. When updating, keep both in sync.

## Self-Management

- **Keep this file under 200 lines.** Move detailed references to `docs/architecture/` and link from here.
- When you make an architectural decision or discover a pattern worth preserving, update this file (or the relevant doc it links to).
- When a documented pattern becomes outdated, remove or correct it immediately.
- Do not duplicate information that already lives in config files (package.json, tailwind.config.cjs, etc.) — reference them instead.
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

Tailwind was chosen for this project because:

1. **Theming via CSS custom properties** — The entire color system is driven by CSS variables (`--color-*`) defined in `src/lib/styles/app.css`. Tailwind's `skin-*` utility classes map to these variables through the `withOpacity()` helper in `tailwind.config.cjs`, enabling three themes (light, dark, catppuccin) without any Tailwind config changes.
2. **Utility-first consistency** — Eliminates naming debates and keeps styles colocated with markup. No separate CSS files per component.
3. **Prose plugin** — `@tailwindcss/typography` handles all markdown-rendered content with theme-aware colors. Customized in `tailwind.config.cjs` lines 47–121.
4. **Small bundle** — PurgeCSS is built in; only used classes ship to production.

**Rule:** Always use `skin-*` classes for theme-aware colors. Never hardcode hex values for themed elements. Use `terminal-*` classes only for the fixed terminal aesthetic (navbar autocomplete, chatbot chrome).

### Theming System

> Detail: [`docs/architecture/theming.md`](docs/architecture/theming.md)

- **Three themes:** light (default), dark, catppuccin — defined via CSS custom properties in `src/lib/styles/app.css`
- **Detection:** Inline script in `src/app.html` runs before hydration (checks localStorage → `prefers-color-scheme`)
- **Runtime toggle:** `ThemeToggle.svelte` cycles themes and persists to localStorage
- **Tailwind integration:** `skin-*` color utilities use `withOpacity()` to support opacity modifiers (e.g., `bg-skin-accent/50`)
- **Dark mode:** `darkMode: ['class']` in Tailwind config — `html.dark` class activates dark/catppuccin styles

### Component Conventions

- **Svelte 5 syntax** is the standard: `$state()`, `$props()`, `$effect()`, `$derived()`, `{@render children()}`
- A few components still use Svelte 4 patterns (`export let`, `$:`) — migrate when touching them, but don't refactor unprompted
- **Props:** Define `interface Props` and destructure via `let { prop } = $props()`
- **Icons:** Use `lucide-svelte` exclusively. Import individual icons (e.g., `import { Menu } from "lucide-svelte"`)
- **Scoped styles:** Use `<style>` blocks in components. Use `:global()` only when styling rendered HTML (e.g., markdown output)

### Content System

- **Markdown files** in `content/blog/` and `content/projects/` use YAML frontmatter (see `ContentMetadata` in `src/lib/types.ts`)
- **Loading:** `import.meta.glob` in `+page.server.ts` files, sorted by date descending
- **Rendering:** mdsvex preprocessor with `PostLayout.svelte` as the default layout
- **Resume data:** YAML files (`resume.yaml`, `resume-ops.yaml`, `resume-builder.yaml`) loaded with `js-yaml`
- **Quick Actions:** Static actions + dynamic content actions loaded via `content-loader.ts`

### Variant System

Three resume variants target different audiences: **leader** (default), **ops**, **builder**.

- Canonical paths: `/resume/`, `/ops/resume/`, `/builder/resume/`
- Other pages: query param `?v=ops`
- Utility: `src/lib/utils/variantLink.ts` — `addVariant()`, `getVariant()`, `removeVariant()`
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

- `SEO.svelte` is required on every page — `title` and `description` are mandatory props
- JSON-LD uses the `${"script"}` variable workaround to avoid ESLint parser errors
- Outputs: Open Graph, Twitter Card, canonical link, keywords

## Formatting & Linting

- **Prettier:** 2-space indent, double quotes, no trailing commas, 100 char width (`.prettierrc`)
- **ESLint:** Flat config (`eslint.config.js`) — TypeScript + Svelte + Prettier compat
- `@typescript-eslint/no-explicit-any` is `warn` (23 existing warnings — reduce, don't add)
- `svelte/no-at-html-tags` is `off` (we use `{@html}` intentionally)

## Dev Server

> **Always check for a running dev server before starting a new one.**

- HMR handles code changes — only restart for `vite.config.ts`, `svelte.config.js`, or `.env` changes
- Run from `site/`: `pnpm dev`

## Testing & Validation

```bash
pnpm run validate          # Full pipeline: check + build + tests
pnpm run check             # svelte-check + TypeScript
pnpm run lint              # ESLint
pnpm run test:e2e          # Playwright
pnpm run test:ui           # UI validation script
pnpm run test:resumes      # Resume YAML validation
pnpm run test:posthog      # PostHog integration validation
pnpm run test:ai           # AI feature validation
```

## Known Gotchas

- **Windows/Playwright:** `gracefulShutdown` needs `SIGINT`, not `SIGTERM`
- **`<script>` in `{@html}`:** Use `${"script"}` variable workaround
- **Pre-existing svelte-check warnings:** `@apply` CSS, deprecated `<slot>`, a11y — known, don't chase
- **Trailing slashes:** All routes use trailing slashes (`strict: false` + `trailingSlash: 'always'`)
- **PostHog paths:** `paths.relative: false` is required in svelte.config.js for session replay
