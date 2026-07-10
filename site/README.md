# briananderson.xyz site

SvelteKit 2 and Svelte 5 static site with Markdown/mdsvex content, schema-validated resume and proof
data, Tailwind themes, deterministic machine-readable outputs, and a Cloud Run Express API.

## Start the site

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Start AI features locally

Add `GEMINI_API_KEY` to `functions/.env.local`, then run two terminals:

```bash
# Terminal 1, from site/functions/
pnpm install --frozen-lockfile
pnpm run dev

# Terminal 2, from site/
pnpm run build-content-index
pnpm dev
```

The local SvelteKit API routes proxy to Express on port 8080. Production calls the
Cloudflare-fronted Cloud Run service directly.

## Build and verify

```bash
pnpm run validate
pnpm run test:e2e
```

Run `pnpm test` from `functions/` for API, security, handler, and MCP coverage.

## Documentation

- [AI features, privacy, evaluation, and edge boundaries](../docs/architecture/ai-features.md)
- [Content authoring and proof ledger](../docs/architecture/content-authoring.md)
- [Themes and semantic status tokens](../docs/architecture/theming.md)

Deployment is automated in `.github/workflows/build-and-deploy.yml`: pushes to `main` deploy dev;
production requires `workflow_dispatch` with `deploy_prod`. The `functions/` name is historical—the
backend is Express on Cloud Run, not Firebase Functions.
