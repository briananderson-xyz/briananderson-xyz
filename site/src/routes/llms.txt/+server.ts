import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { PUBLIC_SITE_URL } from '$env/static/public';
import type { Resume } from '$lib/types';

interface Personal {
	interests: { name: string; description: string }[];
	values: string[];
	hobbies: { name: string; details: string }[];
}

export const prerender = true;

export const GET = async () => {
	const resumePath = path.resolve('content/resume.yaml');
	const resumeContents = fs.readFileSync(resumePath, 'utf-8');
	const resume = yaml.load(resumeContents) as Resume;

	const personalPath = path.resolve('content/personal.yaml');
	const personalContents = fs.readFileSync(personalPath, 'utf-8');
	const personal = yaml.load(personalContents) as Personal;

	const content = `# briananderson.xyz

Personal portfolio and professional site for Brian Anderson - Technical Director & Enterprise Solutions Architect specializing in GenAI, Cloud Native transformation, and DevOps.

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
   - Ops: ${PUBLIC_SITE_URL}/ops/resume/ - Focus on DevOps/SRE
   - Builder: ${PUBLIC_SITE_URL}/builder/resume/ - Focus on hands-on technical work

### Content
- **Blog:** ${PUBLIC_SITE_URL}/blog/ - Technical articles and tutorials
- **Projects:** ${PUBLIC_SITE_URL}/projects/ - Portfolio of software development work
- **RSS Feed:** ${PUBLIC_SITE_URL}/rss.xml - Blog posts in RSS format

## About Brian

${resume.summary}

### Personal Interests
${personal.interests.map((i) => `- **${i.name}:** ${i.description}`).join('\n')}

### Core Values
${personal.values.map((v: string) => `- ${v}`).join('\n')}

### Hobbies
${personal.hobbies.map((h) => `- **${h.name}:** ${h.details}`).join('\n')}

## Expertise

### Primary Focus Areas
- Generative AI integration and agent frameworks
- Cloud Native transformation (AWS, Google Cloud)
- DevOps and CI/CD standardization
- Enterprise architecture and team leadership

### Key Technologies
${Object.entries(resume.skills).slice(0, 5).map(([cat, skills]) => `**${cat}:** ${skills.map((s) => s.name).join(', ')}`).join('\n')}

### Certifications
${resume.certificates.slice(0, 3).map((cert) => `- ${cert.name}`).join('\n')}

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
