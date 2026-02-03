# Complete Implementation Plan: Transition to Query Param-Based Variant System

## Overview
Remove all swiping functionality and transition to a URL-based variant system using:
- **Canonical URLs** (`/ops/resume/`, `/builder/resume/`) for sharing and SEO
- **Query parameters** (`?v=ops`) for navigation context
- **No session storage** - URL is the source of truth
- **Dynamic variant discovery** - No hardcoded variant names
- **Subtle footer variant switcher** - Clickable links to change variants

---

## Phase 1: Remove Swiping Infrastructure

### Files to Delete
```
site/src/lib/components/ResumeViewSwiper.svelte      (549 lines)
site/src/lib/components/ResumeView.svelte            (476 lines)
site/src/lib/actions/useSwipe.ts                      (157 lines)
site/src/routes/resume/[variant]/+page.svelte
site/src/routes/resume/[variant]/+page.server.ts
```

### Files to Modify
**`site/package.json`**
- Remove `"swiper": "^12.1.0"` from dependencies

**Run cleanup:**
```bash
cd site && pnpm install
```

---

## Phase 2: Generate Variant Metadata Dynamically

### Create Build Script

**`site/scripts/generate-variants.js`**
```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const contentDir = path.resolve('site/content');
const files = fs.readdirSync(contentDir);

const variantFiles = files.filter(f => f.startsWith('resume-') && f.endsWith('.yaml'));

const variants = [
  { key: 'default', displayName: 'Default', order: 0 },
  ...variantFiles.map(filename => {
    const key = filename.replace('resume-', '').replace('.yaml', '');
    let order = 99;
    let displayName = key.charAt(0).toUpperCase() + key.slice(1);

    try {
      const content = fs.readFileSync(path.join(contentDir, filename), 'utf-8');
      const data = yaml.load(content);
      if (data?.meta) {
        if (data.meta.order !== undefined) order = data.meta.order;
        if (data.meta.displayName) displayName = data.meta.displayName;
      }
    } catch (e) {
      console.error(`Error reading ${filename}:`, e);
    }

    return { key, displayName, order };
  })
].sort((a, b) => {
  if (a.order !== b.order) return a.order - b.order;
  return a.key.localeCompare(b.key);
});

const outputPath = path.resolve('site/src/lib/data/variants.ts');
fs.writeFileSync(
  outputPath,
  `export const variants = ${JSON.stringify(variants, null, 2)};`
);

console.log('Generated site/src/lib/data/variants.ts');
```

### Auto-Generated File
**`site/src/lib/data/variants.ts`** (auto-generated, don't edit manually)
```typescript
export const variants = [
  { key: 'default', displayName: 'Default', order: 0 },
  { key: 'ops', displayName: 'Ops', order: 1 },
  { key: 'builder', displayName: 'Builder', order: 2 }
];
```

### Update Package Scripts

**`site/package.json`**
Add to `scripts`:
```json
"generate-variants": "node scripts/generate-variants.js",
"prebuild": "npm run generate-variants"
```

---

## Phase 3: Create Utility Functions

**`site/src/lib/utils/variantLink.ts`**
```typescript
export function addVariant(path: string, variant: string | null | undefined): string {
  if (!variant || variant === 'default') return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${variant}`;
}

export function removeVariant(path: string): string {
  const url = new URL(path, 'http://temp.com');
  url.searchParams.delete('v');
  return url.pathname + url.search;
}

export function getVariant(url: URL): string | null {
  return url.searchParams.get('v') || null;
}
```

---

## Phase 4: Create Footer Variant Switcher

**`site/src/lib/components/VariantSwitcher.svelte`**
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { addVariant } from '$lib/utils/variantLink';
  import { variants } from '$lib/data/variants';

  const currentVariant = $page.url.searchParams.get('v') || 'default';
  const currentPath = $page.url.pathname;
</script>

<div class="flex items-center gap-2 text-[10px] uppercase text-skin-muted">
  <span>Variant:</span>
  {#each variants as variant}
    <a
      href={addVariant(currentPath, variant.key)}
      class="hover:text-skin-accent transition-colors {currentVariant === variant.key
        ? 'text-skin-accent font-bold'
        : ''}"
    >
      [{variant.displayName}]
    </a>
  {/each}
</div>
```

**Update `site/src/lib/components/Footer.svelte`**
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import VariantSwitcher from '$lib/components/VariantSwitcher.svelte';

  $: isError = $page.status >= 400;
</script>

<footer class="...">
  <div class="...">
    <!-- Existing content -->

    <!-- Add variant switcher -->
    <div class="flex items-center gap-4">
      <VariantSwitcher />

      <!-- Existing social links -->
      <a href="...">[ github ]</a>
      <a href="...">[ linkedin ]</a>
      <a href="...">[ email ]</a>
    </div>
  </div>
</footer>
```

---

## Phase 5: Simplify Resume Route

**`site/src/routes/resume/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { redirect } from '@sveltejs/kit';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async ({ url }) => {
  const variant = url.searchParams.get('v');

  // Redirect query param to canonical URL
  if (variant) {
    const canonicalPath = variant === 'ops' ? '/ops/resume/' :
                          variant === 'builder' ? '/builder/resume/' :
                          '/resume/';
    throw redirect(302, canonicalPath);
  }

  // Load default resume
  try {
    const filePath = path.resolve('content/resume.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**`site/src/routes/resume/+page.svelte`**
```svelte
<script lang="ts">
  import ResumeContent from '$lib/components/ResumeContent.svelte';

  export let data: { resume: Resume };

  const resume = data.resume;

  const formatSkillsAsDefinedTerms = (skills: Record<string, any[]>) => {
    const definedTerms: any[] = [];
    for (const [category, items] of Object.entries(skills)) {
      for (const skill of items) {
        definedTerms.push({
          "@type": "DefinedTerm",
          "name": typeof skill === "string" ? skill : (skill.altName || skill.name),
          "url": typeof skill === "object" && skill.url ? skill.url : undefined,
          "inDefinedTermSet": category
        });
      }
    }
    return definedTerms;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": resume.name,
    "email": resume.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": resume.location.split(", ")[0],
      "addressRegion": resume.location.split(", ")[1]
    },
    "description": resume.summary,
    "url": "https://briananderson.xyz",
    "sameAs": [
      "https://github.com/briananderson1222",
      "https://www.linkedin.com/in/brian--anderson/"
    ],
    "alumniOf": resume.education.map((edu: any) => ({
      "@type": "CollegeOrUniversity",
      "name": edu.school,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": edu.location.split(", ")[0] || edu.location
      }
    })),
    "hasCredential": resume.certificates.map((cert: any) => ({
      "@type": "EducationalOccupationalCredential",
      "name": cert.name,
      "url": cert.url,
      "credentialCategory": "certification"
    })),
    "hasOccupation": resume.experience.map((job: any) => ({
      "@type": "Occupation",
      "name": job.role,
      "startDate": job.start_date,
      "endDate": job.end_date,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company
      },
      "description": job.description
    })),
    "knowsAbout": formatSkillsAsDefinedTerms(resume.skills)
  };
</script>

<svelte:head>
  <link rel="canonical" href="https://briananderson.xyz/resume/">
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
</svelte:head>

<ResumeContent {resume} />
```

---

## Phase 6: Update Homepage

**`site/src/routes/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { redirect } from '@sveltejs/kit';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async ({ url }) => {
  const variant = url.searchParams.get('v');

  // Redirect query param to canonical URL
  if (variant) {
    const canonicalPath = variant === 'ops' ? '/ops/' :
                          variant === 'builder' ? '/builder/' :
                          '/';
    throw redirect(302, canonicalPath);
  }

  // Load default resume
  try {
    const filePath = path.resolve('content/resume.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**Update `site/src/routes/+page.svelte`**
- Keep existing content
- Import `addVariant` utility
- Update all navigation links to use `addVariant`:
  ```svelte
  <script>
    import { addVariant } from '$lib/utils/variantLink';
    import { page } from '$app/stores';

    $: variant = $page.url.searchParams.get('v');
  </script>

  <a href={addVariant('/resume', variant)}>./resume</a>
  <a href={addVariant('/projects', variant)}>./projects</a>
  <a href={addVariant('/blog', variant)}>./blog</a>
  ```

---

## Phase 7: Create Variant Canonical Routes

### Create `/ops/` Route

**`site/src/routes/ops/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async () => {
  try {
    const filePath = path.resolve('content/resume-ops.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume-ops.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**`site/src/routes/ops/+page.svelte`**
- Extract existing homepage layout from `site/src/routes/+page.svelte` into `site/src/lib/components/Homepage.svelte`
- Use Homepage component with ops variant resume
- Import `addVariant` and update all links to use `?v=ops`:
  ```svelte
  <script>
    import Homepage from '$lib/components/Homepage.svelte';
    import { addVariant } from '$lib/utils/variantLink';

    export let data;
  </script>

  <Homepage
    {data.resume}
    variant="ops"
    links={{
      resume: addVariant('/resume', 'ops'),
      projects: addVariant('/projects', 'ops'),
      blog: addVariant('/blog', 'ops')
    }}
  />
  ```

### Create `/builder/` Route

**`site/src/routes/builder/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async () => {
  try {
    const filePath = path.resolve('content/resume-builder.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume-builder.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**`site/src/routes/builder/+page.svelte`**
- Same structure as `/ops/+page.svelte`
- Use builder variant resume
- Links use `?v=builder`

### Create `/ops/resume/` Route

**`site/src/routes/ops/resume/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async () => {
  try {
    const filePath = path.resolve('content/resume-ops.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume-ops.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**`site/src/routes/ops/resume/+page.svelte`**
```svelte
<script lang="ts">
  import ResumeContent from '$lib/components/ResumeContent.svelte';
  import { addVariant } from '$lib/utils/variantLink';

  export let data: { resume: Resume };

  const resume = data.resume;

  // JSON-LD generation (same as resume/+page.svelte but with canonical URL for ops)
  const jsonLd = { /* ... */ };
</script>

<svelte:head>
  <link rel="canonical" href="https://briananderson.xyz/ops/resume/">
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
</svelte:head>

<ResumeContent {resume} />
```

### Create `/builder/resume/` Route

**`site/src/routes/builder/resume/+page.server.ts`**
```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async () => {
  try {
    const filePath = path.resolve('content/resume-builder.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume-builder.yaml:', e);
    return { resume: {} as Resume };
  }
};
```

**`site/src/routes/builder/resume/+page.svelte`**
- Same structure as `/ops/resume/+page.svelte`
- Canonical URL: `https://briananderson.xyz/builder/resume/`

---

## Phase 8: Extract Reusable Homepage Component

**Create `site/src/lib/components/Homepage.svelte`**
- Extract all content from `site/src/routes/+page.svelte`
- Accept props: `resume`, `variant` (optional), `links` (optional)
- If `links` prop not provided, use `addVariant` with `variant` prop
- If `variant` not provided, links don't have query params

```svelte
<script lang="ts">
  import { addVariant } from '$lib/utils/variantLink';
  import ResumeContent from './ResumeContent.svelte';

  export let resume;
  export let variant: string | null = null;
  export let links: Record<string, string> | null = null;

  $: generatedLinks = links || {
    resume: addVariant('/resume', variant),
    projects: addVariant('/projects', variant),
    blog: addVariant('/blog', variant)
  };
</script>

<!-- All existing homepage content -->
<!-- Use generatedLinks.resume, generatedLinks.projects, generatedLinks.blog -->
```

**Update `site/src/routes/+page.svelte`**
```svelte
<script>
  import Homepage from '$lib/components/Homepage.svelte';

  export let data;
</script>

<Homepage resume={data.resume} />
```

---

## Phase 9: Update Navbar for Variant Context

**`site/src/lib/components/Navbar.svelte`**
```svelte
<script lang="ts">
  import { Menu, Terminal } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { page } from "$app/stores";
  import { addVariant } from "$lib/utils/variantLink";

  let open = false;

  $: activeRoute = $page.url.pathname;
  $: variant = $page.url.searchParams.get('v');
</script>

<!-- Desktop nav -->
<nav class="hidden md:flex gap-6 text-sm items-center">
  <a class="..." href="/#about">./about</a>
  <a class="..." href={addVariant('/resume', variant)}>./resume</a>
  <a class="..." href={addVariant('/projects', variant)}>./projects</a>
  <a class="..." href={addVariant('/blog', variant)}>./blog</a>
  <a class="..." href="/#contact">./contact</a>
  <ThemeToggle />
</nav>

<!-- Mobile nav -->
{#if open}
  <div transition:slide class="...">
    <div class="...">
      <a class="..." on:click={() => (open = false)} href="/#about">./about</a>
      <a class="..." on:click={() => (open = false)} href={addVariant('/resume', variant)}>./resume</a>
      <a class="..." on:click={() => (open = false)} href={addVariant('/projects', variant)}>./projects</a>
      <a class="..." on:click={() => (open = false)} href={addVariant('/blog', variant)}>./blog</a>
      <a class="..." on:click={() => (open = false)} href="/#contact">./contact</a>
    </div>
  </div>
{/if}
```

---

## Phase 10: Update Projects Pages

**`site/src/routes/projects/+page.server.ts`**
```typescript
export const load = async ({ url }) => {
  const variant = url.searchParams.get('v') || null;
  // Load projects data
  return { projects, variant };
};
```

**`site/src/routes/projects/+page.svelte`**
```svelte
<script>
  import { addVariant } from '$lib/utils/variantLink';
  export let data;
</script>

<!-- Projects content -->
<a href={addVariant('/resume', data.variant)}>View Resume</a>
<!-- Other navigation links use addVariant -->
```

**`site/src/routes/projects/[slug]/+page.server.ts`**
```typescript
export const load = async ({ url, params }) => {
  const variant = url.searchParams.get('v') || null;
  // Load project data
  return { project, variant };
};
```

**`site/src/routes/projects/[slug]/+page.svelte`**
```svelte
<script>
  import { addVariant } from '$lib/utils/variantLink';
  export let data;
</script>

<!-- Project content -->
<a href={addVariant('/resume', data.variant)}>View Resume</a>
<a href={addVariant('/projects', data.variant)}>Back to Projects</a>
```

---

## Phase 11: Update Blog Pages

**`site/src/routes/blog/+page.server.ts`**
```typescript
export const load = async ({ url }) => {
  const variant = url.searchParams.get('v') || null;
  // Load blog data
  return { posts, variant };
};
```

**`site/src/routes/blog/+page.svelte`**
```svelte
<script>
  import { addVariant } from '$lib/utils/variantLink';
  export let data;
</script>

<!-- Blog content -->
<a href={addVariant('/resume', data.variant)}>View Resume</a>
<!-- Other navigation links use addVariant -->
```

**`site/src/routes/blog/[slug]/+page.server.ts`**
```typescript
export const load = async ({ url, params }) => {
  const variant = url.searchParams.get('v') || null;
  // Load post data
  return { post, variant };
};
```

**`site/src/routes/blog/[slug]/+page.svelte`**
```svelte
<script>
  import { addVariant } from '$lib/utils/variantLink';
  export let data;
</script>

<!-- Post content -->
<a href={addVariant('/resume', data.variant)}>View Resume</a>
<a href={addVariant('/blog', data.variant)}>Back to Blog</a>
```

---

## Phase 12: Update Tests

**`site/e2e/resume.spec.ts`**

Remove swipe-related tests. Add:

```typescript
test('visiting /ops/ shows ops variant', async ({ page }) => {
  await page.goto('/ops/');
  await expect(page.locator('h1')).toContainText('Site Reliability Architect');
});

test('visiting /ops/resume/ shows ops resume', async ({ page }) => {
  await page.goto('/ops/resume/');
  await expect(page.locator('h1')).toContainText('Site Reliability Architect');
});

test('visiting /resume?v=ops redirects to /ops/resume/', async ({ page }) => {
  await page.goto('/resume?v=ops');
  await expect(page).toHaveURL('/ops/resume/');
});

test('footer shows correct variant name', async ({ page }) => {
  await page.goto('/ops/');
  const variantText = page.locator('.text-skin-muted').filter({ hasText: 'Variant:' });
  await expect(variantText).toContainText('[Ops]');
});

test('footer variant links work', async ({ page }) => {
  await page.goto('/');
  await page.locator('a', { hasText: '[Builder]' }).click();
  await expect(page).toHaveURL('/builder/');
});

test('navigation links preserve variant context', async ({ page }) => {
  await page.goto('/ops/');
  await page.locator('a', { hasText: './projects' }).click();
  await expect(page).toHaveURL('/projects?v=ops');

  await page.locator('a', { hasText: './resume' }).click();
  await expect(page).toHaveURL('/ops/resume/');
});
```

---

## Phase 13: Validation

Run these commands in `site` directory:

```bash
# Generate variants before build
npm run generate-variants

# Type checking
pnpm run check

# Validate resumes
pnpm run test:resumes

# Build
pnpm run build

# UI validation
pnpm run test:ui

# PostHog validation
pnpm run test:posthog

# AI validation
pnpm run test:ai

# Full validation
pnpm run validate

# E2E tests
pnpm run test:e2e
```

---

## Manual Testing Checklist

- [ ] `/` shows default variant homepage
- [ ] `/ops/` shows ops variant homepage
- [ ] `/builder/` shows builder variant homepage
- [ ] `/resume/` shows default resume
- [ ] `/ops/resume/` shows ops resume
- [ ] `/builder/resume/` shows builder resume
- [ ] `/?v=ops` redirects to `/ops/`
- [ ] `/?v=builder` redirects to `/builder/`
- [ ] `/resume?v=ops` redirects to `/ops/resume/`
- [ ] `/resume?v=builder` redirects to `/builder/resume/`
- [ ] `/projects?v=ops` links to `/ops/resume/`
- [ ] `/blog?v=ops` links to `/ops/resume/`
- [ ] Footer shows "Variant: [Default] [Ops] [Builder]"
- [ ] Footer variant links work correctly
- [ ] Current variant is highlighted in footer
- [ ] Navbar links preserve variant context
- [ ] Pre-rendered files exist in `/build/` for all variant routes
- [ ] All navigation preserves variant context
- [ ] No swiping functionality exists
- [ ] `swiper` dependency removed from package.json

---

## Optional YAML Enhancement

Add custom display names to resume YAML files:

**`site/content/resume-ops.yaml`**
```yaml
name: Brian Anderson
meta:
  order: 1
  displayName: "SRE / Ops"
title: Site Reliability Architect & DevOps Platform Engineer
# ... rest of content
```

**`site/content/resume-builder.yaml`**
```yaml
name: Brian Anderson
meta:
  order: 2
  displayName: "Full Stack"
title: Staff Software Engineer & Full-Stack Architect
# ... rest of content
```

If `meta.displayName` is not present, it defaults to capitalized variant key ("Ops", "Builder", etc.).

---

## Summary of Files

### New Files Created
- `site/scripts/generate-variants.js` - Build script
- `site/src/lib/data/variants.ts` - Auto-generated variant metadata
- `site/src/lib/utils/variantLink.ts` - Variant URL utilities
- `site/src/lib/components/VariantSwitcher.svelte` - Footer variant switcher
- `site/src/lib/components/Homepage.svelte` - Extracted homepage component

### Files Deleted
- `site/src/lib/components/ResumeViewSwiper.svelte`
- `site/src/lib/components/ResumeView.svelte`
- `site/src/lib/actions/useSwipe.ts`
- `site/src/routes/resume/[variant]/+page.svelte`
- `site/src/routes/resume/[variant]/+page.server.ts`

### New Route Directories
- `site/src/routes/ops/`
- `site/src/routes/builder/`
- `site/src/routes/ops/resume/`
- `site/src/routes/builder/resume/`

### Files Modified
- `site/package.json` - Remove swiper, add generate-variants script
- `site/src/routes/+page.svelte` - Use Homepage component
- `site/src/routes/+page.server.ts` - Add variant redirect logic
- `site/src/routes/resume/+page.svelte` - Simplify, use ResumeContent
- `site/src/routes/resume/+page.server.ts` - Add variant redirect logic
- `site/src/routes/projects/+page.svelte` - Variant-aware links
- `site/src/routes/projects/+page.server.ts` - Extract variant
- `site/src/routes/projects/[slug]/+page.svelte` - Variant-aware links
- `site/src/routes/projects/[slug]/+page.server.ts` - Extract variant
- `site/src/routes/blog/+page.svelte` - Variant-aware links
- `site/src/routes/blog/+page.server.ts` - Extract variant
- `site/src/routes/blog/[slug]/+page.svelte` - Variant-aware links
- `site/src/routes/blog/[slug]/+page.server.ts` - Extract variant
- `site/src/lib/components/Navbar.svelte` - Variant-aware links
- `site/src/lib/components/Footer.svelte` - Add variant switcher
- `site/e2e/resume.spec.ts` - Update tests

---

## Benefits

✅ **Clean canonical URLs** - `/ops/resume/`, `/builder/resume/` for sharing and SEO
✅ **Query param redirects** - `/?v=ops` → `/ops/` for canonical navigation
✅ **No session storage** - URL is source of truth, simpler architecture
✅ **Dynamic variant discovery** - No hardcoded variant names, auto-generated from YAML
✅ **Customizable display names** - Add `meta.displayName` to YAML files
✅ **Perfect for AI crawlers** - All content pre-rendered in HTML
✅ **Subtle footer switcher** - Clickable variant links, not intrusive
✅ **Variant context preserved** - Navigation links maintain variant across site
✅ **DRY implementation** - `addVariant()` utility used everywhere
✅ **Removes ~1,200 lines** - Swipe code elimination

---

## Final URL Structure

**Canonical URLs (for sharing):**
```
/                    # Default homepage
/ops/                # Ops variant homepage
/builder/            # Builder variant homepage

/resume/             # Default resume
/ops/resume/         # Ops resume
/builder/resume/     # Builder resume
```

**Query Param URLs (for navigation context):**
```
/projects?v=ops      # Projects, links to /ops/resume/
/blog?v=builder      # Blog, links to /builder/resume/
/projects/[slug]?v=ops  # Individual project, variant context
/blog/[slug]?v=ops     # Individual blog post, variant context
```

**Redirects:**
```
/?v=ops              → /ops/
/?v=builder          → /builder/
/resume?v=ops        → /ops/resume/
/resume?v=builder    → /builder/resume/
```
