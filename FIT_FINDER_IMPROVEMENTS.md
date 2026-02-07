# Fit Finder Improvements

## ✅ Phase 1: COMPLETED - UI & Prompt Redesign

### Changes Made:

**1. Updated Types (`src/lib/types.ts`)**
- Added `fitLevel: 'good' | 'maybe' | 'not'` for three-tier fit assessment
- Changed skills structure:  - Removed misleading `metadata` field (was showing "10+ years" without verification)
  - Added `url` for linkable citations
  - Added `context` for brief contextual notes
- Changed experience structure:
  - Renamed `relatedLinks` array to single `url` field
  - Added `relevance` field to explain why this experience matters
- Removed `recommendations` array (was confusing - AI thought it was for hiring managers)
- Added `analysis` string for narrative explanation

**2. Updated Firebase Function (`functions/src/index.ts`)**
- Completely rewrote the Gemini prompt to:
  - Be humble and honest rather than overselling
  - Include actual URLs for projects/blog posts
  - Generate narrative analysis instead of "recommendations"
  - Use three-tier fit levels (good/maybe/not)
  - Provide specific context for each skill/experience match
- Updated mock response to match new structure

**3. Updated UI (`src/lib/components/FitFinder.svelte`)**
- Three-tier fit display: Good Fit ✓ / May Be a Good Fit ~ / Not a Strong Fit ×
- Skills now show with clickable citations and context
- Experience shows relevance explanation and project links
- Removed confusing "Recommendations" section
- Added "Analysis" section with 2-3 paragraph narrative
- CTA prominence adjusts by fit level:
  - **Good fit**: Bold, prominent "Connect with Brian" button
  - **Maybe fit**: Balanced "Discuss Opportunity" button
  - **Not fit**: Subtle email link only
- Gaps section de-emphasized (smaller, muted colors)

---

## 🔄 Phase 2: TODO - Content RAG System

### Problem:
Currently the Firebase function only references `/llms.txt` as a URL. The AI doesn't actually have access to:
- Blog post content and topics
- Project details and tech stacks
- Resume variants and their differences
- Specific skills and where they were used

### Solution: Build-time Content Indexing

Create a static RAG (Retrieval Augmented Generation) system that:
1. Runs at build time
2. Indexes all markdown content
3. Generates a structured JSON knowledge base
4. Makes it available to the Firebase function

### Implementation Plan:

#### 1. Create Content Indexer Script

**File**: `site/scripts/build-content-index.ts`

```typescript
/**
 * Indexes all site content for the Fit Finder RAG system
 * Runs at build time to create a searchable knowledge base
 */

interface ContentIndex {
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  blog: BlogEntry[];
  resume: ResumeData;
  metadata: {
    buildDate: string;
    version: string;
  };
}

interface SkillEntry {
  name: string;
  category: string;
  usedIn: string[]; // URLs where this skill appears
  projects: string[]; // Project slugs
  blog: string[]; // Blog post slugs
}

interface ProjectEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  technologies: string[];
  skills: string[];
  dateRange?: string;
  company?: string;
  role?: string;
}

interface BlogEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  date: string;
  topics: string[]; // Extracted key topics
}

// Parse markdown files, extract frontmatter and content
// Build relationships between skills, projects, and blog posts
// Output to: static/content-index.json
```

**Key features:**
- Parse all `.md` files in `content/projects/` and `content/blog/`
- Extract skills from project frontmatter
- Build reverse index: skill → [projects where it's used]
- Extract topics from blog posts
- Include resume data from YAML
- Output comprehensive JSON file

#### 2. Modify Build Process

**File**: `site/package.json`

```json
{
  "scripts": {
    "build": "npm run build:content-index && vite build",
    "build:content-index": "tsx scripts/build-content-index.ts"
  }
}
```

#### 3. Update Firebase Function to Use Index

**File**: `functions/src/index.ts`

```typescript
// Fetch the content index at function startup
let contentIndex: ContentIndex | null = null;

async function getContentIndex(): Promise<ContentIndex> {
  if (contentIndex) return contentIndex;

  const response = await fetch(`${SITE_URL}/content-index.json`);
  contentIndex = await response.json();
  return contentIndex;
}

// Update prompt to include relevant content
const index = await getContentIndex();

// Filter index based on job description keywords
const relevantSkills = findRelevantSkills(jobDescription, index);
const relevantProjects = findRelevantProjects(jobDescription, index);
const relevantBlog = findRelevantBlog(jobDescription, index);

const prompt = `
Context about Brian (with citations):

SKILLS:
${relevantSkills.map(s => `- ${s.name}: Used in ${s.usedIn.join(', ')}`).join('\n')}

PROJECTS:
${relevantProjects.map(p => `
  ${p.title} (${SITE_URL}${p.url})
  ${p.summary}
  Tech: ${p.technologies.join(', ')}
`).join('\n')}

... (continue with blog posts, experience, etc.)

Job Description:
${jobDescription}
...
`;
```

#### 4. Enhance Content Files

Add structured frontmatter to projects:

```yaml
---
title: GFS Cloud Enablement
company: Gordon Food Service
role: Technical Principal
technologies:
  - AWS
  - Kubernetes
  - Terraform
  - ArgoCD
skills:
  - Cloud Architecture
  - Platform Engineering
  - DevOps
  - Team Leadership
dateRange: 2021-2024
---
```

### Benefits:
- ✅ Actual citations with verifiable links
- ✅ AI can make specific claims backed by content
- ✅ Automatic updates when content changes
- ✅ No manual maintenance required
- ✅ Fast (static generation at build time)
- ✅ No runtime dependencies or vector databases needed

---

## 🧪 Phase 3: TODO - Testing Suite

### 1. E2E Tests for Fit Finder Flow

**File**: `site/e2e/fit-finder.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Fit Finder', () => {
  test('should analyze job description and show good fit', async ({ page }) => {
    await page.goto('/');

    // Wait for connect banner
    await page.waitForSelector('[data-testid="connect-banner"]', {
      timeout: 35000
    });

    // Click to expand
    await page.click('[data-testid="connect-banner-collapsed"]');

    // Click check-fit option
    await page.click('[data-testid="fit-finder-option"]');

    // Should open fit finder modal
    await expect(page.locator('[data-testid="fit-finder"]')).toBeVisible();

    // Enter job description with AWS + Kubernetes + Leadership
    const jd = `
      Senior Platform Engineer

      Required:
      - 5+ years AWS experience
      - Kubernetes expertise
      - Team leadership experience
      - DevOps background
    `;

    await page.fill('[data-testid="jd-input"]', jd);
    await page.click('[data-testid="analyze-button"]');

    // Wait for analysis
    await page.waitForSelector('[data-testid="fit-score"]');

    // Should show good fit
    const score = await page.textContent('[data-testid="fit-score"]');
    expect(parseInt(score!)).toBeGreaterThan(70);

    // Should have matching skills with citations
    await expect(page.locator('[data-testid="matching-skills"]')).toBeVisible();
    const skillLinks = page.locator('[data-testid="matching-skills"] a');
    expect(await skillLinks.count()).toBeGreaterThan(0);

    // Should show CTA
    await expect(page.locator('[data-testid="connect-cta"]')).toBeVisible();
  });

  test('should show maybe fit for partial match', async ({ page }) => {
    // Test with job that has some matches but significant gaps
  });

  test('should show not fit for poor match', async ({ page }) => {
    // Test with completely unrelated job (e.g., medical position)
  });

  test('should link to relevant projects', async ({ page }) => {
    // Verify that clicked project links work
  });
});
```

### 2. Content Index Validation Tests

**File**: `site/tests/content-index.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { buildContentIndex } from '../scripts/build-content-index';

describe('Content Indexer', () => {
  it('should extract all projects', async () => {
    const index = await buildContentIndex();
    expect(index.projects.length).toBeGreaterThan(0);

    // Each project should have required fields
    index.projects.forEach(p => {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.url).toMatch(/^\/projects\//);
    });
  });

  it('should build skill relationships', async () => {
    const index = await buildContentIndex();

    // AWS should be linked to GFS project
    const aws = index.skills.find(s => s.name === 'AWS');
    expect(aws).toBeTruthy();
    expect(aws!.projects).toContain('gfs-cloud-enablement');
  });

  it('should extract blog topics', async () => {
    const index = await buildContentIndex();
    expect(index.blog.length).toBeGreaterThan(0);
  });
});
```

### 3. API Mock Tests

**File**: `site/tests/fit-finder-api.test.ts`

```typescript
describe('Fit Finder API', () => {
  it('should return good fit for matching job', async () => {
    const response = await fetch('/api/fit-finder', {
      method: 'POST',
      body: JSON.stringify({
        jobDescription: 'AWS Kubernetes DevOps Leader'
      })
    });

    const data = await response.json();
    expect(data.analysis.fitLevel).toBe('good');
    expect(data.analysis.fitScore).toBeGreaterThan(70);
  });

  it('should include citations for all skills', async () => {
    const response = await fetch('/api/fit-finder', {
      method: 'POST',
      body: JSON.stringify({
        jobDescription: 'AWS Kubernetes DevOps Leader'
      })
    });

    const data = await response.json();
    data.analysis.matchingSkills.forEach(skill => {
      if (skill.url) {
        expect(skill.url).toMatch(/^https?:\/\//);
      }
      expect(skill.context).toBeTruthy();
    });
  });
});
```

---

## 📊 Success Metrics

After implementing all phases:

1. **Accuracy**: All skill/experience claims have verifiable citations
2. **Informativeness**: Analysis explains "why" not just "what"
3. **Honesty**: Gaps are acknowledged without dwelling on them
4. **Usefulness**: Hiring managers get actionable insights
5. **Maintenance**: Zero manual updates needed (all automated via build)

---

## Next Steps

1. **Review Phase 1 changes** - Test the new UI and prompt in production
2. **Implement Phase 2** - Build the content indexing system
3. **Implement Phase 3** - Add comprehensive test coverage
4. **Iterate** - Use test results to identify what content is missing and where to add it

---

## Questions to Consider

1. Should we also index resume data for each variant?
2. Should blog posts be weighted differently than projects?
3. Should we track which projects were most recent for recency bias?
4. Should we add a feedback mechanism to improve the analysis over time?
