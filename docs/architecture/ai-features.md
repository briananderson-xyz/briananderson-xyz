# AI Features

## System boundary

Chat, Fit Finder, and MCP share one Express implementation and container image. Deployment creates
separate Chat and Fit Finder Cloud Run services. The repository exposes `/mcp` in the shared image,
but which live service the Worker routes that path to is external configuration and remains
unverified here. The intended public path is:

```text
Browser or MCP client
  -> Cloudflare Worker (shared edge policy)
  -> Cloud Run Express API (origin verification and per-instance defense)
  -> content tools (versioned static index)
  -> Gemini 2.5 Flash
```

The SvelteKit application is statically prerendered. Routes under `site/src/routes/api/` proxy to the
local Express service during development; they are not a production server tier.

The Worker-to-origin token is verified before the API trusts `cf-connecting-ip`. Cloudflare owns the
shared rate-limit boundary. Express also applies an in-memory limiter, but those counters are neither
shared across Cloud Run instances nor durable. Source and generated policy can prove the intended
contract; live edge activation, service health, secret rotation, provider retention, and model
behavior require external evidence.

## Retrieval and model use

The configured model is `gemini-2.5-flash` in `site/functions/src/handlers.ts`. Both user-facing
features use Gemini function calling against the content index rather than attaching all portfolio
content to every request.

The content tools can:

- search skills and their explicit project/blog evidence;
- search projects and fetch a full project by slug;
- search experience;
- retrieve skills by category and a resume summary.

Skills have canonical IDs in the resume YAML. Content declares those IDs in `skills`, or uses an
exact configured alias. Evidence joins never use substring inference. In particular, a short skill
name contained inside another phrase must not create a relationship.

The browser stores prior Chat turns in `sessionStorage`. The outgoing request contains the newest
prompt once in `message`; `history` contains only earlier valid turns. Since that history is supplied
by the client, the API never converts its assistant/model labels into Gemini `model` roles. It quotes
all prior entries in a bounded, delimiter-neutralized, explicitly untrusted transcript within the
current user turn. The current request remains separately delimited. This preserves conversational
context without treating client labels as authentication; it does not solve prompt injection.

## Content index and proof sources

`site/scripts/build-content-index.ts` parses schema-validated projects, posts, and resume data. It
sorts inputs and serialization and derives its date from `SOURCE_DATE_EPOCH` or source content, so
identical inputs produce the same hash and files.

| Artifact                    | Cache intent                            |
| --------------------------- | --------------------------------------- |
| `content-index.<hash>.json` | Immutable versioned payload             |
| `content-index-latest.json` | Short-lived pointer to the current hash |
| `content-index.json`        | Compatibility fallback                  |

Quantified claims are separate from search evidence. `site/content/proof-ledger.yaml` maps stable
claim IDs to the case-study route, exact supporting excerpt, evidence state, and review date. The
homepage and `/proof/` load that same validated ledger.

## Privacy and analytics

Prompts, model responses, and pasted job descriptions are sensitive content. Local PostHog defaults
therefore disable autocapture, automatic exception capture, and session recording and mask text and
element attributes. Chat and Fit Finder containers are marked as no-capture/masked as defense in
depth. Explicit AI analytics record event names only and discard every supplied property. They send
no prompts, job text, lengths, URLs, variants, model scores, confidence, recommendations, or other
user/model-derived output.

These source controls do not prove remote PostHog configuration. Project access, retention, and any
provider-side recording settings must be reviewed in PostHog.

## Evaluations

Endpoint smoke tests and AI evaluations answer different questions. API tests prove routing,
validation, guardrails, and tool compatibility. Evaluations assess grounded behavior.

The public `/ai-evals/` route reads `site/content/ai-eval-history.json`. Publication is opt-in and the
schema accepts only:

- a run ID, date, commit, and environment;
- suite IDs and opaque scenario digests;
- pass, fail, skip, total, and pass-rate aggregates.

Prompts, answers, job descriptions, endpoints, errors, and model/judge metadata are rejected or
removed by `site/scripts/publish-ai-eval-history.ts`. With no trustworthy published run, the dashboard
shows `baseline-pending` rather than synthetic results.

`/trace-one-answer/` documents the request path and labels repository-verified behavior separately
from external contracts and runtime assumptions.

## Edge security contract

`site/security-policy.json` is the canonical header policy. `site/src/hooks.server.ts` consumes it for
development/preview and dynamic responses. `site/scripts/validate-security-policy.mjs` generates and
checks `site/security/cloudflare-activation-policy.json` for the live edge.

The required HTTP response headers are:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

Static HTML includes only the safe meta-policy subset as defense in depth. HSTS, nosniff,
permissions policy, and CSP `frame-ancestors` require HTTP headers. The CSP currently documents its
inline-script/style exceptions because SvelteKit hydration, JSON-LD, and existing styles need them;
do not claim nonce/hash enforcement until those resources are externalized or hashed.

The generated Cloudflare rate contract applies a shared key across `/chat`, `/fit-finder`, and `/mcp`.
The current policy values live in the generated JSON and function configuration; documentation should
link to those files instead of duplicating values that can drift.

After a build, regenerate and validate the policy:

```bash
cd site
pnpm run build
node scripts/validate-security-policy.mjs --write
node scripts/validate-security-policy.mjs
```

Activation requires an authorized Cloudflare change. Append the generated rules to the correct phase
entrypoint rather than replacing unrelated rules. Verify production with `curl -sSI
https://briananderson.xyz/`; until all exact header values are present, activation is **NOT_VERIFIED**.
Do not exercise production rate limits destructively during routine verification.

## MCP

`site/functions/src/mcp.ts` implements stateless Streamable HTTP at `POST /mcp` in the shared Express
image. Each request creates a fresh server and transport, which fits an ephemeral multi-instance
service. Live Worker-to-service routing for `/mcp` is external and must be verified separately. Its
tools reuse the same content and handlers as the REST features:

| Tool              | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `get_resume`      | Fetch a leader, ops, or builder JSON resume |
| `search_projects` | Query projects through `ContentTools`       |
| `search_skills`   | Query canonical skills and evidence         |
| `ask_brian`       | Invoke the Chat handler                     |
| `analyze_fit`     | Invoke the Fit Finder handler               |

The server is advertised in `/llms.txt`. SDK integration coverage lives in
`site/functions/src/mcp.test.ts`.

## Local development

Create `site/functions/.env.local` with `GEMINI_API_KEY`, then use two terminals:

```bash
# Terminal 1
cd site/functions
pnpm run dev

# Terminal 2
cd site
pnpm run build-content-index
pnpm run dev
```

The API listens on port 8080 and the site defaults to port 5173. `LOCAL_API_ORIGIN` can override the
development proxy target.

Useful checks:

```bash
cd site && pnpm run test:content-index && pnpm run test:security-policy
cd site/functions && pnpm test
```

## Deployment and infrastructure policy

The API is built as a production-only, non-root container and deployed to Cloud Run. Static assets go
to GCS with cache policy applied by the build-and-deploy workflow.

GitHub Actions authenticate with WIF through distinct planning, Terraform-apply, and application-
deployment identities. A pull-request Terraform plan is review evidence only. The main workflow must
check out the exact `GITHUB_SHA`, create a saved plan from that checkout, and apply that same file
behind the protected `production` environment. Third-party Actions are pinned to full commit SHAs.

Repository policy is enforced by:

```bash
cd site
pnpm run test:workflow-policy
```

Provider-side production-environment reviewers, WIF bindings, Cloudflare activation, and analytics
retention remain external checks.

## Freshness

Review this document and the flagship “Building this site” post at least quarterly and whenever the
model, API host, storage layer, analytics configuration, edge policy, or deployment workflow changes.
Prefer links to configuration over copied version/count claims. Update the `updated` frontmatter on
affected public content after verification.
