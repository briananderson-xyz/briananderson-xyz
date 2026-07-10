# Repository Agent Guide

`AGENTS.md` and `CLAUDE.md` are mirrors. Keep them byte-for-byte identical and under 200 lines.
Move detailed architecture guidance to `docs/architecture/` and link it here.

## Documentation

- Do not create random Markdown files for plans, status, or notes.
- Permanent architecture belongs here or in a focused `docs/architecture/` document.
- Temporary AI artifacts belong in `.ai-docs/` or `.kontourai/flow-agents/` as appropriate.
- Update existing documentation in place and remove obsolete guidance promptly.
- Human-facing files under `docs/` stand alone and must not reference agent instruction files.

## Project

**Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 3, and mdsvex.

**Output:** static site through `@sveltejs/adapter-static`, hosted in GCS behind Cloudflare.

**Dynamic API:** Express on Cloud Run behind a Cloudflare Worker.
**Package manager:** pnpm; run application commands from `site/`

| Directory          | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `site/src/`        | Application code, components, routes, schemas, utilities |
| `site/content/`    | Blog, project, proof, evaluation, and resume source data |
| `site/functions/`  | Cloud Run Express API; the directory name is historical  |
| `site/scripts/`    | Build and validation scripts                             |
| `site/static/`     | Static assets and generated content-index files          |
| `infra/terraform/` | GCP infrastructure and WIF configuration                 |

## Architecture rules

### Static first

- Prerender page routes. Every `+page.server.ts` exports `prerender = true`.
- Build-time load functions may not depend on request cookies, headers, or runtime responses.
- `src/routes/api/` proxies exist for local development only.
- Runtime server logic belongs in `site/functions/`, not SvelteKit page routes.
- Production clients call the Cloudflare-fronted Cloud Run API.

### Components and styling

- Prefer Svelte 5 runes: `$state`, `$props`, `$effect`, `$derived`, and snippets.
- When touching legacy Svelte 4 syntax, migrate only the component in scope.
- Props use `interface Props` and destructuring from `$props()`.
- Use individual `lucide-svelte` icon imports.
- Use scoped styles; reserve `:global()` for rendered HTML such as Markdown.
- Use theme-aware `skin-*` utilities. Status UI uses semantic success/warning/error pairs.
- Hardcoded or `terminal-*` colors are only for fixed terminal chrome and documented brand colors.
- Preserve the terminal identity while pairing opaque labels with plain-language meaning.

See [`docs/architecture/theming.md`](docs/architecture/theming.md).

### Content and evidence

- Markdown and YAML are validated build inputs, not untyped blobs.
- Required content metadata and optional fields are defined in `src/lib/schemas/content.ts`.
- Use canonical resume skill IDs in content. Never infer evidence with substring matching.
- Quantified/prominent claims belong in `content/proof-ledger.yaml`; homepage and `/proof/` share it.
- Proof entries require a stable ID, exact source excerpt, evidence state, and review date.
- Use `updated` only for a verified material revision; freshness is `updated`, then `date`.
- Keep project `outcome` and `projectType` vocabulary reusable for filtering.
- Public eval history contains aggregate counts and opaque scenario IDs only—never prompts or output.
- Run a quarterly freshness pass over claims, links, screenshots, model names, and architecture prose.

See [`docs/architecture/content-authoring.md`](docs/architecture/content-authoring.md).

### AI, privacy, and edge boundaries

- Chat, Fit Finder, and MCP share the Cloud Run tools and handlers.
- The configured Gemini model lives in `site/functions/src/handlers.ts`; verify it before documenting.
- Chat history uses `sessionStorage`; send the current prompt once, outside prior history.
- Never send prompts, responses, job descriptions, or model output to analytics.
- PostHog keeps autocapture and replay disabled and text/attributes masked.
- The Worker owns the shared rate limit; Express memory limits are per-instance defense only.
- Verify the Worker-to-origin boundary before trusting Cloudflare IP headers.
- Source policy does not prove live Cloudflare, PostHog, secret, or provider configuration.
- Public eval and trace pages must distinguish repository proof from external/runtime assumptions.

See [`docs/architecture/ai-features.md`](docs/architecture/ai-features.md).

### CI and infrastructure

- Pin third-party GitHub Actions to full commit SHAs with readable version comments.
- Use supported Node versions and least job permissions; keep policy validation blocking.
- Every PR runs credential-free Terraform validation; same-repository trust changes add a sanitized,
  read-only remote plan. A protected `main` merge is the sole apply authorization.
- Main verifies exact `GITHUB_SHA`, creates a fresh locked plan, and applies that same local file.
- Terraform planning, apply, and application deployment use distinct WIF identities.
- Apply uses the main-only `terraform-apply` environment for scoped credentials, without a second
  reviewer gate; production application deployment remains manual.
- The API image is multi-stage, production-only, digest-pinned, and non-root.
- Provider settings and production activation require external verification.

## Variants

Resume variants are leader (default), ops, and builder.

- Canonical resume paths: `/resume/`, `/ops/resume/`, `/builder/resume/`.
- Other pages use `?v=ops` or `?v=builder`; use `src/lib/utils/variantLink.ts`.
- Keep identity, contact, education, certificates, and other shared facts synchronized.

## SEO and generated outputs

- Every page uses `SEO.svelte` with title and description.
- JSON-LD uses the existing script workaround required by the Svelte parser.
- Generated outputs include content-index variants, sitemap, RSS, resume JSON, and llms views.
- Keep builds deterministic: sorted input/serialization and source-derived dates, not wall-clock time.
- Rebuild generated files through scripts; never hand-edit them.

## Development

Always check for an existing dev server before starting one. HMR handles normal source changes; restart
only for Vite, Svelte config, or environment changes.

```bash
cd site
pnpm dev
```

For AI features, also run `pnpm run dev` in `site/functions/` (port 8080) with
`GEMINI_API_KEY` in `site/functions/.env.local`.

## Formatting and validation

- Prettier: 2 spaces, double quotes, no trailing commas, 100 columns.
- ESLint uses flat TypeScript/Svelte config; reduce rather than add explicit `any` warnings.
- Intentional rendered HTML means `svelte/no-at-html-tags` is disabled.

| Command (from `site/`)          | Purpose                                                             |
| ------------------------------- | ------------------------------------------------------------------- |
| `pnpm run validate`             | Full policy, type, schema, build, theme, UI, and analytics pipeline |
| `pnpm run lint`                 | ESLint                                                              |
| `pnpm run check`                | Svelte and TypeScript checks                                        |
| `pnpm run test:unit`            | Vitest unit suite                                                   |
| `pnpm run test:e2e`             | Playwright end-to-end suite                                         |
| `pnpm run test:content`         | Content/frontmatter/link/schema checks                              |
| `pnpm run test:content-index`   | Index and skill-evidence invariants                                 |
| `pnpm run test:resumes`         | Resume YAML invariants                                              |
| `pnpm run test:workflow-policy` | Action pin, Node, and Terraform workflow policy                     |

Run API tests from `site/functions/` with `pnpm test`.

## Known constraints

- Routes use trailing slashes.
- The `<script>` workaround in rendered HTML/JSON-LD is intentional.
- `paths.relative: false` is required for current PostHog/SvelteKit behavior.
- Windows Playwright shutdown uses `SIGINT`, not `SIGTERM`.
- Do not chase unrelated warnings or broad refactors while working a scoped task.
