# briananderson.xyz — SvelteKit + Markdown

> **📚 Full documentation:** See [`../CLAUDE.md`](../CLAUDE.md) or [`../AGENTS.md`](../AGENTS.md)

**Stack:** SvelteKit 2 + Svelte 5 + TypeScript + Tailwind CSS 3 + Cloud Run (Express) API

## Quick Start

```bash
pnpm i
pnpm dev
```

## Build & Deploy

```bash
pnpm run build              # Builds content index + static site
```

Deployment is automated via GitHub Actions: a push to `main` deploys the static
site to GCS (dev) and the Express API to Cloud Run. Production is a manual
`workflow_dispatch`. See [`../.github/workflows/build-and-deploy.yml`](../.github/workflows/build-and-deploy.yml).
The `functions/` directory name is Firebase heritage; the backend now runs on Cloud Run.

## AI Features

- **Chat:** AI assistant using Gemini function calling to answer questions about Brian's background
- **Fit Finder:** Analyzes job descriptions against Brian's skills/experience with tool-based retrieval
- **Content Index:** Auto-generated at build time from markdown files (versioned for cache-busting)

See [`../docs/architecture/ai-features.md`](../docs/architecture/ai-features.md) for details.

## Documentation

- **Architecture & Patterns:** [`../CLAUDE.md`](../CLAUDE.md)
- **AI Features:** [`../docs/architecture/ai-features.md`](../docs/architecture/ai-features.md)
