import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { PUBLIC_SITE_URL } from "$env/static/public";
import type { ContentMetadata } from "$lib/types";
import { loadResume } from "$lib/server/loadResume";
import { buildResumeMarkdown } from "$lib/server/resumeMarkdown";

interface Personal {
  interests: { name: string; description: string }[];
  values: string[];
  hobbies: { name: string; details: string }[];
}

export const prerender = true;

export const GET = async () => {
  const resume = loadResume("resume.yaml");

  const personalPath = path.resolve("content/personal.yaml");
  const personalContents = fs.readFileSync(personalPath, "utf-8");
  const personal = yaml.load(personalContents) as Personal;

  const overview = `# briananderson.xyz — Full Content Archive

This is a single, complete text export of briananderson.xyz for AI agents and crawlers: site overview, full resume, and the raw Markdown source of every blog post and project. For a shorter, links-only summary see ${PUBLIC_SITE_URL}/llms.txt.

**Owner:** Brian Anderson
**Location:** ${resume.location}
**Email:** ${resume.email}

## Evidence and AI Architecture

- **Claims & Evidence:** ${PUBLIC_SITE_URL}/proof/ - Sources and limitations behind selected portfolio claims.
- **How This Site's AI Works:** ${PUBLIC_SITE_URL}/trace-one-answer/ - The implemented request path, privacy boundaries, aggregate checks, and external verification limits.

## About Brian

${resume.summary}

### Personal Interests
${personal.interests.map((i) => `- **${i.name}:** ${i.description}`).join("\n")}

### Core Values
${personal.values.map((v: string) => `- ${v}`).join("\n")}

### Hobbies
${personal.hobbies.map((h) => `- **${h.name}:** ${h.details}`).join("\n")}
`;

  const resumeMarkdown = `---

# Full Resume

${buildResumeMarkdown(resume)}`;

  const blogModules = import.meta.glob("/content/blog/**/*.md", {
    query: "?raw",
    import: "default",
    eager: true
  }) as Record<string, string>;
  const projectModules = import.meta.glob("/content/projects/**/*.md", {
    query: "?raw",
    import: "default",
    eager: true
  }) as Record<string, string>;
  const metaModules = {
    ...(import.meta.glob("/content/blog/**/*.md", { eager: true }) as Record<
      string,
      { metadata: ContentMetadata }
    >),
    ...(import.meta.glob("/content/projects/**/*.md", { eager: true }) as Record<
      string,
      { metadata: ContentMetadata }
    >)
  };

  const renderSection = (title: string, modules: Record<string, string>) =>
    `---

# ${title}

${Object.entries(modules)
  .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath))
  .map(([filePath, raw]) => {
    const slug = filePath.replace("/content", "").replace(".md", "");
    const meta = metaModules[filePath]?.metadata;
    return `---

## ${meta?.title ?? slug}

Source: ${PUBLIC_SITE_URL}${slug}/

${raw}`;
  })
  .join("\n\n")}`;

  const blogSection = renderSection("Blog Posts", blogModules);
  const projectSection = renderSection("Projects", projectModules);

  const content = [overview, resumeMarkdown, blogSection, projectSection].join("\n\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};
