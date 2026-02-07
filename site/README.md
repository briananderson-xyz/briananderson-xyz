# briananderson.xyz — SvelteKit + Markdown

> **📚 Full documentation:** See [`../CLAUDE.md`](../CLAUDE.md) or [`../AGENTS.md`](../AGENTS.md)

**Stack:** SvelteKit 2 + Svelte 5 + TypeScript + Tailwind CSS 3 + Firebase Functions

## Quick Start

```bash
pnpm i
pnpm dev
```

## Build & Deploy

```bash
pnpm run build              # Builds content index + static site
firebase deploy             # Deploys to GCS + Firebase Functions
```

## AI Features

- **Chat:** AI assistant using Gemini function calling to answer questions about Brian's background
- **Fit Finder:** Analyzes job descriptions against Brian's skills/experience with tool-based retrieval
- **Content Index:** Auto-generated at build time from markdown files (versioned for cache-busting)

See [`../docs/architecture/ai-features.md`](../docs/architecture/ai-features.md) for details.

## Documentation

- **Architecture & Patterns:** [`../CLAUDE.md`](../CLAUDE.md)
- **AI Features:** [`../docs/architecture/ai-features.md`](../docs/architecture/ai-features.md)
- **Quick Start Guide:** [`../QUICK_START.md`](../QUICK_START.md)
