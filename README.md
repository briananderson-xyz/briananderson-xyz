# briananderson.xyz

The source for [briananderson.xyz](https://briananderson.xyz): a static-first SvelteKit portfolio with
schema-validated writing, evidence-linked claims, machine-readable resume/content surfaces, and an
Express AI API on Cloud Run.

## Repository map

- `site/` — SvelteKit application, content, build scripts, and Cloud Run API
- `infra/terraform/` — GCP resources, WIF identities, and Terraform state configuration
- `docs/architecture/` — durable content, theme, and AI architecture documentation
- `.github/workflows/` — validation, exact-revision infrastructure, evaluation, and delivery workflows

## Quick start

```bash
cd site
pnpm install --frozen-lockfile
pnpm dev
```

For Chat, Fit Finder, and MCP development, add `GEMINI_API_KEY` to
`site/functions/.env.local` and run the API separately:

```bash
cd site/functions
pnpm install --frozen-lockfile
pnpm run dev
```

The site defaults to port 5173 and the API to port 8080.

## Validate

```bash
cd site
pnpm run validate
pnpm run test:e2e

cd functions
pnpm test
```

## Architecture

- [AI features and external security boundaries](docs/architecture/ai-features.md)
- [Content authoring, proof, and freshness](docs/architecture/content-authoring.md)
- [Themes and semantic color tokens](docs/architecture/theming.md)
- [Terraform bootstrap and identity separation](infra/terraform/README.md)

## Delivery

GitHub Actions build and validate with Node 22, authenticate to Google Cloud through Workload Identity
Federation, deploy the static output to GCS, and deploy a non-root container to Cloud Run. Production
deployment is an explicit workflow input.

Terraform uses separate read-only planning and privileged apply identities. Pull-request plans are
review evidence only. A main-branch infrastructure run checks out the exact triggering SHA, creates a
new saved plan from that revision, and applies the same plan behind the protected `production`
environment.

Live Cloudflare headers/rate rules, GitHub environment reviewers, WIF bindings, secrets, analytics
retention, and provider state are external configuration and cannot be proven by this repository
alone.
