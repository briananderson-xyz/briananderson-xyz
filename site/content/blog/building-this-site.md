---
title: Building this site (with AI)
date: 2026-01-12
summary: A deep dive into the stack behind briananderson.xyz - SvelteKit, Tailwind, Catppuccin, and Agentic workflows.
tags: ["SvelteKit", "AI", "Tailwind", "CICD", "GCP", "Firebase", "Builder"]
keywords: ["site", "meta", "agentic", "catppuccin"]
---

This site exists because I needed a place that was more than a resume. Resumes flatten everything. A multi-year enterprise engagement becomes a bullet point, a startup you poured yourself into becomes a line item. I wanted something that could hold the full picture: the technical depth, the narrative, and the proof that I build things. The site itself is the first portfolio piece.

## The Stack

I wanted a personal site that felt like *me*: technical, minimal, and functional. The choice of **SvelteKit** was primarily an exploration using a new technology, balancing static site generation (SSG) for performance with dynamic capabilities where needed.

- **Framework:** SvelteKit (`adapter-static`)
- **Styling:** Tailwind CSS + Typography
- **Content:** Markdown (mdsvex) + YAML (resume)
- **Backend:** Firebase Cloud Functions (GenAI Chat, FitFinder API)
- **Hosting:** Google Cloud Storage (Bucket) + Cloudflare CDN
- **CI/CD:** GitHub Actions (build, deploy, Playwright E2E)
- **Infrastructure:** Terraform (GCS, WIF, service accounts), Cloudflare DNS
- **AI Assistants:** Gemini 3, Claude Code & OpenCode (Implementation & Refactoring)

## Theming & UX

The aesthetic starts with a nod to my daily environment, the terminal, but has evolved to be more flexible.

- **Terminal Mode:** Deep blacks (`#0c0c0c`) and neon greens (`#4af626`) with CRT scanlines.
- **Catppuccin Mode:** A softer, pastel-based dark theme for better readability, which now defaults for users with system-wide dark mode.
- **Print Optimization:** The resume page is heavily optimized for print-to-PDF, automatically removing navigation, changing fonts to **Lato** for readability, and adjusting margins for a perfect one-page layout.

## CI/CD & Infrastructure

This isn't just a static bucket upload. The site uses a robust **GitHub Actions** pipeline:

1. **Build:** Compiles the SvelteKit app into static HTML/JS.
2. **Deploy:** Syncs the `build/` directory to a Google Cloud Storage bucket.
3. **Cache:** Optimizes delivery via Cloudflare CDN with automatic cache control headers.
4. **Terraform:** Infrastructure as code provisions GCS buckets, WIF provider, and CI service account via Workload Identity Federation.

## Built with AI Agents

What makes this project unique is the workflow. I've used CLI-based AI agents (starting with Gemini and OpenCode, and increasingly with Claude Code) to handle the heavy lifting across testing, infrastructure, and UX optimization.

Instead of writing every CSS class or Terraform resource by hand, I act as the **Architect**, directing agents with structured, intent-based instructions:

> "Implement E2E smoke tests using Playwright. Verify homepage loads with correct title, navigation to resume works, and resume page renders properly. Run tests after each deploy with automatic rollback on failure."

> "Set up Workload Identity Federation for GitHub Actions. Configure OIDC provider with attribute mapping, restrict access to specific repo/branch, and create CI service account with Storage Admin role for secure deployments without long-lived keys."

> "Optimize the resume page for print-to-PDF. Hide navigation and scanlines with `@media print`, switch to Lato serif font family, adjust margins to 0.5in, and restructure layout for single-page A4 output with smaller text sizes."

This approach lets me focus on *design and content strategy* while agents handle the implementation details. It's where development is headed: we curate and direct rather than just type.

## Interactive Features

The site has grown beyond a static portfolio into something more interactive.

- **GenAI Chat (Ctrl+I):** An AI chatbot powered by Firebase Cloud Functions that answers questions about my experience, skills, and projects. Terminal-styled to match the site aesthetic, with conversation history persisted via localStorage and full markdown rendering in responses.

- **FitFinder (Ctrl+F):** An AI-powered job-fit analyzer. Paste a job description, get a scored analysis with matching skills, relevant experience, gaps, and a resume variant recommendation (leader/ops/builder). Color-coded scoring: green for 80+, yellow for 60-79, red below 60.

- **Quick Actions (Ctrl+K):** A command palette that combines static navigation with dynamic content discovery. It searches across all blog posts and projects using title, summary, tags, and keywords from frontmatter so you can find content by topic, not just by page name.

- **Keyboard Navigation:** A full shortcut system built on a custom `useKeyboardShortcuts` hook. Cross-platform (Cmd on Mac, Ctrl on Windows), with modal coordination that prevents shortcuts from stacking. A shortcuts help dialog (Ctrl+Shift+?) shows everything available.

## Optimizing for AI

This is the part I'm most interested in long-term. As AI assistants increasingly mediate how people discover information, I wanted the site to be legible to machines, not just humans. Three layers handle this:

- **llms.txt:** A plain-text endpoint generated from resume and personal YAML data at build time. It tells AI models what the site is, who I am, and where to find structured data. Basically a README for language models crawling the web.

- **resume.json:** A JSONResume 1.0.0 standard endpoint that converts my YAML resume data into a standardized schema. Consumable by ATS systems, recruiter tools, and AI agents. Includes custom metadata (tagline, mission) beyond the standard spec, with variant endpoints for different resume versions (builder, ops, leader).

- **JSON-LD Structured Data:** Schema.org Person markup on the homepage and resume page. Covers occupation history, credentials, skills as DefinedTerms, alumni info, and contact points. This enables rich search snippets and gives search engines structured context about who I am and what I do.

These three layers create a machine-readable identity. **llms.txt** for AI assistants, **resume.json** for ATS and recruiters, **JSON-LD** for search engines. However someone (or something) finds me, they get accurate, structured information.

## What's Next

This site is a living project. Every feature I add is both useful and demonstrative. The AI integration, the structured data, the keyboard-driven UX, none of it is accidental. It's all intentional, and it's all built to evolve.

## Source

All of the code behind this site is open source.

- [briananderson-xyz/briananderson-xyz](https://github.com/briananderson-xyz/briananderson-xyz) - SvelteKit site, Firebase Cloud Functions, Terraform infrastructure
- [briananderson-xyz/briananderson-xyz-dns](https://github.com/briananderson-xyz/briananderson-xyz-dns) - Cloudflare DNS configuration
