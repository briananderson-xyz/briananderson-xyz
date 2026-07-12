# Content Authoring Guide

Markdown is human-authored, but its metadata is build input. `pnpm run test:content` validates every
blog post and project with `site/src/lib/schemas/content.ts`, reports the file and field on failure,
checks links between content pages, and requires nonempty alt text for images.

## Shared frontmatter

Every file in `site/content/blog/` and `site/content/projects/` requires:

```yaml
---
title: "Project or post title"
date: 2026-07-09
summary: "One-sentence list and search description."
tags: ["PascalCase", "Topic"]
keywords: ["lowercase", "search-phrase"]
---
```

Dates use `YYYY-MM-DD`. `date` is the real publication date and must not be backdated to make a batch
of posts look older. Add `updated` only after materially revising and verifying the page; it must not
precede `date`. RSS, sitemap, JSON-LD, and other publication/freshness consumers prefer `updated`,
then `date`, and do not substitute build time.

For a retrospective post, use `projectDate` when repository history or another source supports an
exact work milestone. Use `eventPeriod` instead when only an honest coarse period is known, such as
`Early 2026`. These fields are mutually exclusive and are displayed separately from publication
history. Never invent day-level precision or use either field as a freshness signal.

Optional shared fields are:

- `updated`, `projectDate`, `eventPeriod`, `period`, `readingTime`, and `showTableOfContents`;
- `links` for rendered source/live/documentation buttons;
- `skills` containing canonical resume skill IDs;
- `proof` containing stable IDs from `proof-ledger.yaml`;
- `variant` (`leader`, `ops`, or `builder`);
- `outcome` and `projectType` for filtering and comparison.

Use canonical IDs from the resume YAML, for example `google-cloud`, `sveltekit`, or `terraform`.
Aliases are exact and centralized in the resume data. Do not add alternate spellings to content and do
not rely on substring matching.

## Projects

Create `site/content/projects/<slug>.md`. A complete project can add:

```yaml
featuredImage: "/projects/<slug>/hero.png"
featuredImageAlt: "What the image shows"
featuredImageCaption: "Optional visible caption"
skills: ["google-cloud", "terraform"]
proof: ["stable-proof-claim-id"]
variant: ops
outcome: "Platform modernization"
projectType: "Enterprise transformation"
visualArchive:
  images:
    - path: "/projects/<slug>/screenshot.png"
      alt: "What this screenshot shows"
      caption: "Optional lightbox caption"
```

Rules:

- Put assets in `site/static/projects/<slug>/`.
- URL-encode spaces in asset URLs, though filenames without spaces are preferred.
- `featuredImageAlt` is required whenever `featuredImage` is present.
- Every `visualArchive` image needs nonempty alt text.
- Use `visualArchive` instead of raw HTML gallery markup.
- Projects without an archive may use inline Markdown images; `ImageGallery` makes them keyboard- and
  lightbox-accessible.
- Keep `outcome` and `projectType` concise and reuse existing vocabulary so filters remain useful.

The projects page exposes query-addressable variant, skill, outcome, type, and comparison state. New
metadata should improve that catalog rather than create a near-duplicate category.

## Blog posts

Create `site/content/blog/<slug>.md` with the shared required fields. Posts can use inline Markdown
images, each with meaningful alt text. They do not use `visualArchive`.

Use `updated` for a verified material revision, not for typo-only edits or the current build date. For
posts describing a live system, check configured versions and service boundaries in source before
naming them.

Credit identifiable inspiration and collaborators directly. Describe what the implementation actually
borrowed without implying code lineage or feature equivalence that the source does not establish.
Retrospectives must distinguish a prototype or event from ongoing work and production use. Pages about
current focus require Brian's explicit review; repository activity alone is not enough to infer priorities.

## Links

Projects and posts can render structured buttons:

```yaml
links:
  - label: "Source repository"
    url: "https://github.com/example/repository"
    type: "github"
```

Supported types are `case-study`, `github`, `live`, `article`, `docs`, and `website`. URLs may be
HTTP(S), `mailto:`, a root-relative route, or a fragment. Use structured links for source/live lists;
use prose links when they are part of the argument.

## Proof ledger

`site/content/proof-ledger.yaml` is the source for quantified or otherwise prominent claims. Each
entry includes:

- a stable kebab-case ID;
- homepage order by resume variant when selected there;
- exact display text and project route;
- the source project file and an excerpt that must exist verbatim;
- an evidence state (`documented`, `externally-corroborated`, or `self-reported`);
- `freshness.reviewedAt` no earlier than the source page freshness.

The source path must resolve to the case-study route. Do not encode confidence in marketing prose or
change an evidence state without support. The homepage and `/proof/` intentionally share this data.

## AI evaluation history

`site/content/ai-eval-history.json` is generated/public data, not an authoring surface. Publication is
opt-in through `site/scripts/publish-ai-eval-history.ts` and includes only commit/date/environment,
opaque scenario IDs, and aggregate counts. Never commit prompts, outputs, job descriptions, endpoint
details, error bodies, or model/judge metadata. Leave status as `baseline-pending` until a trustworthy
run is deliberately published.

## Author checklist

Run from `site/`:

```bash
pnpm run test:content
pnpm run build-content-index
pnpm run test:content-index
pnpm run build
```

Before publishing:

- verify claims against the linked source and add/update proof-ledger entries where appropriate;
- confirm internal routes and external links;
- inspect image alt text in context;
- check long titles and code at mobile widths;
- rebuild the content index rather than editing generated JSON by hand.

At least quarterly, review time-sensitive posts, proof review dates, external links, configured model
names, infrastructure descriptions, and stale screenshots. Update or remove claims that no longer
describe the implementation.
