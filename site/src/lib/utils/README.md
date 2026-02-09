# Content Loader Utilities

## Overview

The `content-loader.ts` utility dynamically loads blog posts and projects from markdown files and converts them into QuickAction items for the command palette.

## How It Works

### Automatic Loading

All markdown files in `/content/blog/` and `/content/projects/` are automatically discovered and added to the quick actions menu. The system uses:

- **Title**: From frontmatter `title` field
- **Description**: From frontmatter `summary` field
- **Keywords**: Automatically generated from:
  - `tags` array (converted to lowercase)
  - Optional `keywords` array (for additional search terms)
  - The file slug

### Frontmatter Schema

```yaml
---
title: "Your Post Title"
date: 2026-01-12
summary: "A brief description shown in quick actions"
tags: ["Tag1", "Tag2"]  # Used for keywords
keywords: ["custom", "search", "terms"]  # Optional: additional search terms
---
```

### Example

```yaml
---
title: Building this site (with AI)
date: 2026-01-12
summary: A deep dive into the stack behind briananderson.xyz
tags: ["SvelteKit", "AI", "Tailwind", "CI/CD", "GCP"]
keywords: ["site", "meta", "agentic", "catppuccin"]
---
```

This will be searchable by:
- "building", "site", "ai" (from title)
- "sveltekit", "ai", "tailwind", "cicd", "gcp" (from tags)
- "site", "meta", "agentic", "catppuccin" (from keywords)
- "building-this-site" (from slug)

## Adding New Content

Simply create a new markdown file in `/content/blog/` or `/content/projects/` with proper frontmatter. It will automatically appear in quick actions on the next page load.

## Usage in Components

```typescript
import { loadContentActions } from '$lib/utils/content-loader';

// Load all blog and project actions
const actions = await loadContentActions();

// Or load separately
const blogActions = await loadBlogActions();
const projectActions = await loadProjectActions();
```
