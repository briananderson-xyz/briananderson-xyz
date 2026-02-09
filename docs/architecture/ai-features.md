# AI Features (Chat & Fit Finder)

## Overview

Both Chat and Fit Finder use **Gemini function calling** with tool-based retrieval. Instead of sending all content in every request, the AI calls tools to fetch only what it needs, reducing tokens by ~70% while providing grounded responses with verifiable citations.

## Architecture

```
User → SvelteKit API Route → Firebase Function → Gemini AI
                                     ↓
                              Content Index (versioned JSON)
                                     ↓
                              Tools (search, filter, retrieve)
```

**Key principle:** Markdown files in `content/` are the source of truth. At build time, they're indexed into a versioned JSON file that the AI queries via tools.

## Content Index System

### Build Process

**Script:** `site/scripts/build-content-index.ts`

Runs automatically via `prebuild` before every `pnpm run build`. Parses:
- Projects (`content/projects/*.md`)
- Blog posts (`content/blog/*.md`)
- Resume data (`content/resume.yaml`)

Generates structured JSON with:
- 47 skills → project/blog linkages
- 5 projects with full metadata
- 7 experience entries with highlights
- Resume summary and categories

### Versioned Output

Three files generated in `static/`:

| File | Purpose | Cache Headers |
|------|---------|---------------|
| `content-index.{hash}.json` | Immutable content, hash-based filename | `max-age=31536000, immutable` (1 year) |
| `content-index-latest.json` | Pointer file with current hash | `max-age=60, must-revalidate` (60s) |
| `content-index.json` | Fallback for backwards compatibility | `max-age=300, must-revalidate` (5min) |

**Cache strategy:**
1. Firebase function fetches `content-index-latest.json` (always fresh, 60s cache)
2. Gets hash from pointer: `c2cd0c88`
3. Checks if cached version matches hash
4. If not, fetches `content-index.c2cd0c88.json` (CDN cached 1 year)
5. New deploy = new hash = cache miss = fresh data ✅

Cache headers are set in `.github/workflows/build-and-deploy.yml` during GCS upload.

## Available Tools

**Implementation:** `site/functions/src/tools.ts`

The AI can call these tools during analysis:

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `search_skills` | `keywords: string[]` | Find skills with evidence (projects/blog where used) |
| `search_projects` | `keywords: string[]` | Search projects by keywords/tags |
| `get_project` | `slug: string` | Get full project details |
| `search_experience` | `keywords: string[]` | Search work experience by role/company |
| `get_skills_by_category` | `category: string` | Get all skills in a category |
| `get_resume_summary` | — | Get resume overview |

**Tool execution:** Firebase function (`functions/src/index.ts`) executes tool calls and returns results to Gemini in a loop (max 10 iterations for Fit Finder, 5 for Chat).

## Local Testing

### Setup

1. **Set Gemini API key:**
   ```bash
   cd site/functions
   echo "GEMINI_API_KEY=your-key" > .env.local
   ```

2. **Build content index:**
   ```bash
   cd site
   pnpm run build-content-index
   ```

### Run Locally (Two Terminals)

**Terminal 1 - Firebase Functions:**
```bash
cd site/functions
pnpm run serve              # Port 5001
```

**Terminal 2 - SvelteKit:**
```bash
cd site
pnpm run dev                # Port 5173
```

**Dev mode detection:** API routes (`/api/chat`, `/api/fit-finder`) automatically use `http://localhost:5001` when `dev=true` in `$app/environment`.

### Testing

1. Open `http://localhost:5173`
2. For Fit Finder: Wait for connect banner or trigger via console: `localStorage.removeItem('connect_banner_dismissed')`
3. Click "$ connect" → "$ check-fit"
4. Paste job description (try: AWS, Kubernetes, leadership keywords)
5. Watch Network tab for tool calls

## Deployment

```bash
cd site
pnpm run build              # Builds content index + site
firebase deploy             # Deploys functions + hosting
```

**What happens:**
1. `prebuild` runs `build-content-index` automatically
2. Generates versioned JSON files with new hash
3. GitHub Actions uploads to GCS with proper cache headers
4. Firebase Functions deploy updated tool code
5. New requests fetch new versioned index = no stale data

## Key Files

| File | Purpose |
|------|---------|
| `site/scripts/build-content-index.ts` | Builds versioned content index |
| `site/functions/src/tools.ts` | Tool definitions and implementations |
| `site/functions/src/index.ts` | Firebase Functions (chat, fitFinder) |
| `site/src/routes/api/chat/+server.ts` | SvelteKit proxy to chat function |
| `site/src/routes/api/fit-finder/+server.ts` | SvelteKit proxy to fitFinder function |
| `.github/workflows/build-and-deploy.yml` | Sets cache headers for content index |

## Cost Analysis

**Per Fit Finder Request (~$0.0007):**
- Initial request: ~500 tokens
- Tool calls: 3-5 calls × 200 tokens = 600-1000 tokens
- Final response: ~800 tokens
- **Total: ~1900-2300 tokens**

**Savings vs. sending full 21KB context every time: ~70% token reduction**

## Future Enhancements

Potential tool additions:
- `search_blog(keywords)` when more blog content exists
- `get_certifications()` for credentials
- `compare_skills(required, optional)` for structured fit scoring
- Caching common tool results in function memory
