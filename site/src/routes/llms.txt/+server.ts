import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { loadResume } from '$lib/server/loadResume';

interface Personal {
	interests: { name: string; description: string }[];
	values: string[];
	hobbies: { name: string; details: string }[];
}

export const prerender = true;

export const GET = async () => {
	const resume = loadResume('resume.yaml');

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
 - **Markdown Resume:** ${PUBLIC_SITE_URL}/resume.md - Plain-text/Markdown resume for LLM ingestion
 - **Resume Variants:**
   - Leader: ${PUBLIC_SITE_URL}/resume/ - Focus on leadership and architecture (JSON: ${PUBLIC_SITE_URL}/resume.json)
   - Ops: ${PUBLIC_SITE_URL}/ops/resume/ - Focus on DevOps/SRE (JSON: ${PUBLIC_SITE_URL}/ops/resume.json)
   - Builder: ${PUBLIC_SITE_URL}/builder/resume/ - Focus on hands-on technical work (JSON: ${PUBLIC_SITE_URL}/builder/resume.json)

### Content
- **Blog:** ${PUBLIC_SITE_URL}/blog/ - Technical articles and tutorials
- **Blog Markdown Mirrors:** ${PUBLIC_SITE_URL}/blog/{slug}.md - Raw Markdown source of each post
- **Projects:** ${PUBLIC_SITE_URL}/projects/ - Portfolio of software development work
- **Project Markdown Mirrors:** ${PUBLIC_SITE_URL}/projects/{slug}.md - Raw Markdown source of each project
- **Interests:** ${PUBLIC_SITE_URL}/interests/ - Personal interests, values, and hobbies
- **RSS Feed:** ${PUBLIC_SITE_URL}/rss.xml - Blog posts in RSS format
- **Content Index:** ${PUBLIC_SITE_URL}/content-index.json - Structured JSON index of skills, experience, projects, and blog posts for agent tooling
- **Whole-Site Text Archive:** ${PUBLIC_SITE_URL}/llms-full.txt - Single document with the site overview, full resume, and every blog/project body concatenated

## Agent API

Live, CORS-enabled Cloud Run endpoints for programmatic interaction. Also reachable through the site's same-origin proxy routes (\`${PUBLIC_SITE_URL}/api/chat\`, \`${PUBLIC_SITE_URL}/api/fit-finder\`), which forward the request body as-is.

### POST https://api.briananderson.xyz/chat
Conversational Q&A grounded in Brian's resume/project/blog content.

Request:
\`\`\`json
{
  "message": "string (required)",
  "history": [{ "role": "user | model | assistant", "content": "string" }],
  "variant": "leader | ops | builder"
}
\`\`\`

Response:
\`\`\`json
{ "response": "string" }
\`\`\`

### POST https://api.briananderson.xyz/fit-finder
Analyzes a pasted job description against Brian's background and returns a fit assessment.

Request:
\`\`\`json
{
  "jobDescription": "string (required)",
  "variant": "leader | ops | builder"
}
\`\`\`

Response:
\`\`\`json
{
  "analysis": {
    "fitScore": "number (0-100)",
    "fitLevel": "good | maybe | not",
    "confidence": "low | medium | high",
    "matchingSkills": [{ "name": "string", "context": "string" }],
    "matchingExperience": [{ "role": "string", "company": "string", "dateRange": "string", "relevance": "string" }],
    "gaps": ["string"],
    "analysis": "string",
    "resumeVariantRecommendation": "leader | ops | builder",
    "cta": { "text": "string", "link": "string" }
  }
}
\`\`\`

### MCP Server (POST https://api.briananderson.xyz/mcp)
An MCP (Model Context Protocol) server over Streamable HTTP, so any MCP-capable agent can query Brian directly. Add \`https://api.briananderson.xyz/mcp\` as a Streamable-HTTP MCP server. Stateless JSON-RPC: send \`initialize\`, then \`tools/list\` or \`tools/call\`. Tools:
- \`get_resume(variant?: "leader" | "ops" | "builder")\` - Brian's resume as JSONResume for the chosen persona.
- \`search_projects(query: string)\` - projects matching keywords, with summaries and links.
- \`search_skills(query: string)\` - skills matching keywords, with the projects/posts that evidence them.
- \`ask_brian(question: string)\` - free-form Q&A grounded in Brian's content (same engine as the site chatbot).
- \`analyze_fit(job_description: string, variant?: "leader" | "ops" | "builder")\` - structured fit analysis of a role against Brian's background.

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
