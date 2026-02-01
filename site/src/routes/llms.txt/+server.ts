import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { PUBLIC_SITE_URL } from '$env/static/public';

export const prerender = true;

export const GET = async () => {
	const filePath = path.resolve('content/resume.yaml');
	const fileContents = fs.readFileSync(filePath, 'utf-8');
	const resume: any = yaml.load(fileContents);

	const content = `# briananderson.xyz

Personal portfolio and professional site for Brian Anderson - Technical Director & Enterprise Solutions Architect specializing in GenAI, Cloud Native transformation, and DevOps.

---
# AI Content Signals / AI Preferences

## AI Permissions
- **Indexing**: allow
- **Archiving**: allow
- **Summarization**: allow
- **Training**: allow
- **Citation**: required
- **Attribution**: required

## AI Usage Guidelines
This site content may be used by AI systems for:
- Indexing and searching
- Creating summaries and overviews
- Training AI models (with citation)
- Generating responses with proper attribution

**Requirements**: When using content from this site in AI-generated outputs, include attribution to briananderson.xyz and, where applicable, a link to the source page.

---

## Site Overview

**Owner:** Brian Anderson
**Location:** ${resume.location}
**Email:** ${resume.email}
**Purpose:** Portfolio showcasing technical expertise, projects, writings, and resume variants

## AI-Readable Endpoints

### Resume Data
- **Resume Page:** ${PUBLIC_SITE_URL}/resume/ - Human-readable resume with JSON-LD schema markup
- **JSON Resume:** ${PUBLIC_SITE_URL}/resume.json - JSONResume 1.0.0 schema for programmatic parsing
- **Resume Variants:**
  - Leader: ${PUBLIC_SITE_URL}/resume/ - Focus on leadership and architecture
  - Ops: ${PUBLIC_SITE_URL}/resume/ops/ - Focus on DevOps/SRE
  - Builder: ${PUBLIC_SITE_URL}/resume/builder/ - Focus on hands-on technical work

### Content
- **Blog:** ${PUBLIC_SITE_URL}/blog/ - Technical articles and tutorials
- **Projects:** ${PUBLIC_SITE_URL}/projects/ - Portfolio of software development work
- **RSS Feed:** ${PUBLIC_SITE_URL}/rss.xml - Blog posts in RSS format

## About Brian

${resume.summary}

## Expertise

### Primary Focus Areas
- Generative AI integration and agent frameworks
- Cloud Native transformation (AWS, Google Cloud)
- DevOps and CI/CD standardization
- Enterprise architecture and team leadership

### Key Technologies
${Object.entries(resume.skills).slice(0, 5).map(([cat, skills]: [string, any]) => `**${cat}:** ${skills.map((s: any) => s.name).join(', ')}`).join('\n')}

### Certifications
${resume.certificates.slice(0, 3).map((cert: any) => `- ${cert.name}`).join('\n')}

## Featured Work

### Gordon Food Service Modernization
- **Role:** Senior Technical Principal at Kin + Carta
- **Achievement:** Designed and evangelized a "Golden Path" for cloud adoption
- **Impact:** 99% deployment speed improvement, enabling 3,000+ deployments/year
- **Case Study:** https://cloud.google.com/customers/gordon-food-service

## Technical Stack

- **Framework:** SvelteKit 2 with Svelte 5
- **Styling:** Tailwind CSS
- **Deployment:** Static site generation
- **Analytics:** PostHog
`;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
};
