# Content Authoring Guide

## Adding a Project

Create `content/projects/<slug>.md` with this frontmatter:

```yaml
---
title: "Project Title"
date: YYYY-MM-DD
summary: "One-sentence description shown on the projects list."
tags: ["Tag1", "Tag2"]        # PascalCase, no spaces or hyphens
keywords: ["seo", "terms"]    # lowercase, hyphenated
featuredImage: "/projects/<slug>/hero.png"
featuredImageAlt: "Description of hero image"
visualArchive:                # optional — drives the screenshot gallery
  images:
    - path: "/projects/<slug>/screenshot.png"
      alt: "What this screenshot shows"
      caption: "Optional caption shown in the lightbox"
---
```

**Rules:**
- Images go in `site/static/projects/<slug>/`
- URL-encode spaces in filenames: `my file.png` → `my%20file.png`
- `featuredImage` is the card thumbnail on `/projects/` and the SEO image
- `visualArchive` renders as a clickable grid via `VisualArchive.svelte` with fullscreen `Lightbox`
- **Do not** embed raw HTML `<div>` galleries in the markdown body — use `visualArchive` frontmatter
- Projects without `visualArchive` still work; `ImageGallery` auto-detects inline `<img>` tags in the prose

## Links (projects and blog)

Both projects and blog posts support a `links` frontmatter field rendered by `ProjectLinks.svelte` as a row of styled buttons below the prose.

```yaml
links:
  - label: "Display text"
    url: "https://..."
    type: "case-study"   # case-study | github | live | article | docs
```

- `type` controls the icon (GitHub → `Github`, live → `Globe`, everything else → `ExternalLink`)
- **Do not** put external link lists in the markdown prose — use `links` frontmatter instead

## Adding a Blog Post

Create `content/blog/<slug>.md` with the same frontmatter fields (`title`, `date`, `summary`, `tags`, `keywords`, and optionally `links`). Blog posts do not support `visualArchive` — use inline markdown images instead (they will be lightbox-clickable via `ImageGallery`).
