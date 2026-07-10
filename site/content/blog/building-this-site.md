---
title: Building this site (with AI)
date: 2026-01-12
updated: 2026-07-09
summary: A deep dive into the static-first portfolio, its Cloud Run AI API, and the evidence and privacy boundaries behind it.
tags: ["SvelteKit", "AI", "Tailwind", "CICD", "GCP", "Builder"]
keywords: ["site", "meta", "agentic", "catppuccin"]
skills: ["sveltekit", "google-cloud", "terraform", "github-actions", "model-context-protocol"]
links:
  - label: "briananderson-xyz/briananderson-xyz"
    url: "https://github.com/briananderson-xyz/briananderson-xyz"
    type: "github"
  - label: "briananderson-xyz/briananderson-xyz-dns"
    url: "https://github.com/briananderson-xyz/briananderson-xyz-dns"
    type: "github"
---

This site exists because I needed a place that was more than a resume. Resumes flatten
everything. A multi-year enterprise engagement becomes a bullet point; a startup you poured
yourself into becomes a line item. I wanted something that could hold the technical depth, the
narrative, and the evidence behind what I say I have built. The site itself is the first portfolio
piece.

It is also a useful constraint: if I claim that I care about architecture, accessibility, delivery,
security, or AI evaluation, the repository should show those concerns in practice.

## The stack

The public site is intentionally static-first. Dynamic work belongs behind a separate API boundary.

- **Application:** SvelteKit 2 and Svelte 5, prerendered with `adapter-static`
- **Styling:** Tailwind CSS, CSS custom properties, and the Typography plugin
- **Content:** Markdown through mdsvex, plus schema-validated YAML for resumes and proof claims
- **AI API:** Express on Cloud Run, fronted by a Cloudflare Worker
- **Model:** Gemini 2.5 Flash (`gemini-2.5-flash`) with function calling
- **Hosting:** Google Cloud Storage behind Cloudflare
- **Delivery:** GitHub Actions using Workload Identity Federation instead of stored service-account keys
- **Infrastructure:** Terraform for GCS, Cloud Run, Artifact Registry, IAM, and WIF

The split matters. Pages can be cached and served without a SvelteKit server. Chat, Fit Finder, and
MCP requests travel through the edge to Cloud Run. Development-only SvelteKit routes proxy those
requests locally; they are not the production backend.

## A terminal aesthetic without a terminal-only interface

The visual language starts with my daily environment: monospaced type, command-like labels, and a
light scanline treatment. Three themes share the same semantic token system:

- **Light:** a readable neutral theme with emerald accents
- **Dark:** the sharper terminal treatment
- **Catppuccin:** a softer Mocha palette for a less severe dark mode

Theme-aware UI uses `skin-*` utilities. Success, warning, and error states have their own semantic
tokens and contrast colors rather than borrowing a hardcoded terminal green or red. Fixed
`terminal-*` colors are reserved for terminal chrome. The resume also has a dedicated print layout
for people who still want a PDF-like artifact from the HTML page.

The terminal vocabulary should add character, not hide meaning. Opaque system labels are paired
with plain-language descriptions, and the keyboard-first interactions still need conventional
landmarks, focus behavior, and accessible names.

## Content is data, not just prose

Markdown remains the writing format, but publishing is stricter than dropping a file into a folder.
Blog and project frontmatter is validated with Zod. Required titles, dates, summaries, tags, and
keywords fail the build when malformed. Images require alternative text, internal content links must
resolve, and projects can declare stable skill IDs, proof IDs, outcome, type, and resume variant.

Skills are joined by canonical IDs and exact aliases. That is deliberately less clever than fuzzy
substring matching: a short skill name appearing inside an unrelated phrase must never become
evidence.

Quantified homepage claims come from a separate proof ledger. Each claim has a stable ID, a case
study route, a supporting excerpt, an evidence state, and a review date. The homepage and public
Proof Ledger consume the same source. A claim cannot silently point at whichever project card is
most convenient.

The build also creates deterministic, versioned content-index JSON. Sorted inputs and a source-derived
date keep the hash stable for identical source. The immutable file can be cached for a year, while a
short-lived pointer tells the API which version to load.

## The AI request path

Chat and Fit Finder use the same retrieval tools rather than sending the entire portfolio with every
prompt. Gemini can search skills, projects, and experience or request a complete project and resume
summary. The content index supplies the grounding.

The path is:

1. The browser sends a request to the Cloudflare Worker.
2. The Worker applies the shared edge contract and forwards an authenticated origin request.
3. Cloud Run verifies that origin boundary before trusting Cloudflare client-IP metadata.
4. Express applies a per-instance, in-memory limiter as defense in depth.
5. The handler lets Gemini 2.5 Flash (`gemini-2.5-flash`) call the content tools and returns the
   sanitized result.

The repository can verify the code and generated policy for that path. It cannot prove live
Cloudflare activation, secret rotation, provider retention, or current service health; those remain
external operational checks. The public **Trace One Answer** page makes that distinction explicit.

Chat history uses `sessionStorage`, so a conversation survives navigation in the tab but is cleared
when that tab session ends. The current prompt is sent once, separately from prior valid history.

## Privacy is a product boundary

Job descriptions and chat prompts may contain sensitive text. PostHog therefore runs with DOM
autocapture and session recording disabled, with text and attributes masked as defense in depth.
AI events go through an allowlist that accepts outcome metadata such as status, score band, or
duration—not prompts, responses, job descriptions, or model output.

Those local controls do not make remote provider settings irrelevant. Retention, access, and any
project-side recording configuration still need to be reviewed in PostHog itself.

## Smoke tests are not evaluations

The delivery pipeline has several distinct layers:

- type, schema, lint, unit, content, accessibility, policy, and production-build checks;
- browser tests for routes and interactions;
- API tests for origin validation, payload limits, rate limits, tools, and MCP;
- AI evaluations for grounded behavior, tracked separately from endpoint availability.

The public AI evaluation dashboard accepts only sanitized aggregates: commit, date, opaque scenario
IDs, and pass/fail/skip counts. It publishes no prompts, answers, job text, endpoints, error bodies,
or model/judge metadata. Until a trustworthy run is deliberately published, it says that the
baseline is pending instead of presenting invented trend data.

## Delivery and infrastructure

GitHub Actions authenticate to Google Cloud through WIF. Planning, Terraform apply, and application
deployment use distinct identities. Pull-request Terraform plans are review evidence only. On the
main branch, the workflow checks out the exact `GITHUB_SHA`, creates a new saved plan from that
checkout, and applies that same plan behind the protected `production` environment.

Third-party Actions are pinned to immutable commit SHAs, and repository policy tests guard against
mutable tags and unsupported Node versions returning. That does not remove the need for dependency
and action updates; it makes those updates explicit reviewable changes.

The API container is built in stages and runs as a non-root user with production dependencies only.
Cloudflare owns the public response-header and shared-rate boundaries. The repository stores and
tests the canonical policies, while live activation remains a deployment responsibility rather than
a claim inferred from source code.

## Built with agents, reviewed like software

I use coding agents for exploration, planning, implementation, review, and verification. My role is
not to outsource judgment. It is to define the outcome and boundaries, make decisions explicit, and
ask for evidence that the result works.

That means an agent-generated change still needs the same things I would expect from any change:
source-grounded claims, scoped edits, tests that prove the behavior, adversarial review, and a clear
statement of what remains unverified. The workflow is most valuable when it makes engineering rigor
more repeatable, not when it merely produces code faster.

## Machine-readable by design

The site exposes several views of the same underlying portfolio:

- **`llms.txt` and `llms-full.txt`:** maps for assistants and crawlers
- **`resume.json`:** JSON Resume output for ATS and other tools
- **JSON-LD:** structured identity, credentials, and experience for search engines
- **MCP:** tools for agents to query the deployed resume, projects, skills, Chat, and Fit Finder
- **Proof Ledger:** claim-to-source relationships with explicit evidence state and freshness

The goal is not to publish more copies of my identity. It is to make each representation traceable to
validated source content.

## What is next

This remains a living project. The quarterly content-freshness pass is as important as dependency
maintenance: review dates and links, confirm quantified claims against their case studies, check the
configured model and infrastructure descriptions, and retire prose that no longer describes the
system.

The interesting frontier is not another chatbot skin. It is making the path from claim to source,
request to tool call, and evaluation to release decision easier to inspect.

## Source

All of the code behind this site is open source.
