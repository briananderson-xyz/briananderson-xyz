/**
 * Build-time Content Indexer for Fit Finder RAG System
 *
 * Parses all markdown content (projects, blog posts) and resume YAML files,
 * builds skill-to-content relationships, and outputs a structured JSON index
 * to static/content-index.json for the Firebase function to consume.
 *
 * Run: pnpm build-content-index
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";

const SITE_URL = "https://briananderson.xyz";
const CONTENT_DIR = path.join(process.cwd(), "content");
const STATIC_DIR = path.join(process.cwd(), "static");
const OUTPUT_FILE = path.join(STATIC_DIR, "content-index.json");

// --- Types ---

interface ContentIndex {
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  blog: BlogEntry[];
  resume: {
    name: string;
    title: string;
    tagline: string;
    summary: string;
    location: string;
    email: string;
    skillCategories: Record<string, string[]>;
  };
  metadata: {
    buildDate: string;
    version: string;
    projectCount: number;
    blogCount: number;
    skillCount: number;
    experienceCount: number;
  };
}

interface SkillEntry {
  name: string;
  category: string;
  projects: string[];
  blog: string[];
}

interface ExperienceEntry {
  role: string;
  company: string;
  dateRange: string;
  location: string;
  description: string;
  highlights: string[];
}

interface ProjectEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  keywords: string[];
  date: string;
  contentExcerpt: string;
}

interface BlogEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  keywords: string[];
  date: string;
}

// --- Parsing ---

function parseMarkdownFiles(
  dir: string
): Array<{ slug: string; frontmatter: Record<string, any>; content: string }> {
  const results: Array<{
    slug: string;
    frontmatter: Record<string, any>;
    content: string;
  }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`  ⚠ Directory not found: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(dir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);
    const slug = file.replace(/\.md$/, "");
    results.push({ slug, frontmatter, content });
  }

  return results;
}

function parseResumeYaml(filename: string): Record<string, any> | null {
  const filePath = path.join(CONTENT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Resume not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return yaml.load(content) as Record<string, any>;
}

function extractContentExcerpt(content: string, maxLength = 500): string {
  // Strip markdown syntax, take first N chars
  const plain = content
    .replace(/^---[\s\S]*?---/, "") // frontmatter
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^\s*[-*]\s+/gm, "") // list markers
    .replace(/\n{2,}/g, "\n") // multiple newlines
    .trim();

  return plain.length > maxLength
    ? plain.slice(0, maxLength) + "..."
    : plain;
}

// --- Builders ---

function buildProjectEntries(): ProjectEntry[] {
  const projectFiles = parseMarkdownFiles(path.join(CONTENT_DIR, "projects"));

  return projectFiles
    .map(({ slug, frontmatter, content }) => ({
      slug,
      title: frontmatter.title || slug,
      url: `${SITE_URL}/projects/${slug}/`,
      summary: frontmatter.summary || "",
      tags: frontmatter.tags || [],
      keywords: frontmatter.keywords || [],
      date: frontmatter.date
        ? new Date(frontmatter.date).toISOString().split("T")[0]
        : "",
      contentExcerpt: extractContentExcerpt(content)
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildBlogEntries(): BlogEntry[] {
  const blogFiles = parseMarkdownFiles(path.join(CONTENT_DIR, "blog"));

  return blogFiles
    .map(({ slug, frontmatter }) => ({
      slug,
      title: frontmatter.title || slug,
      url: `${SITE_URL}/blog/${slug}/`,
      summary: frontmatter.summary || "",
      tags: frontmatter.tags || [],
      keywords: frontmatter.keywords || [],
      date: frontmatter.date
        ? new Date(frontmatter.date).toISOString().split("T")[0]
        : ""
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildSkillIndex(
  projects: ProjectEntry[],
  blog: BlogEntry[],
  resumeSkills: Record<string, Array<{ name: string }>>
): SkillEntry[] {
  const skillMap = new Map<string, SkillEntry>();

  // Seed from resume skills (authoritative list)
  for (const [category, skills] of Object.entries(resumeSkills)) {
    for (const skill of skills) {
      const key = skill.name.toLowerCase();
      if (!skillMap.has(key)) {
        skillMap.set(key, {
          name: skill.name,
          category,
          projects: [],
          blog: []
        });
      }
    }
  }

  // Match project tags/keywords to skills
  for (const project of projects) {
    const allTerms = [
      ...project.tags.map((t) => t.toLowerCase()),
      ...project.keywords.map((k) => k.toLowerCase())
    ];

    for (const [key, skill] of skillMap) {
      const skillLower = skill.name.toLowerCase();
      const matches = allTerms.some(
        (term) =>
          term === skillLower ||
          term.includes(skillLower) ||
          skillLower.includes(term)
      );
      if (matches && !skill.projects.includes(project.slug)) {
        skill.projects.push(project.slug);
      }
    }
  }

  // Match blog tags/keywords to skills
  for (const post of blog) {
    const allTerms = [
      ...post.tags.map((t) => t.toLowerCase()),
      ...post.keywords.map((k) => k.toLowerCase())
    ];

    for (const [key, skill] of skillMap) {
      const skillLower = skill.name.toLowerCase();
      const matches = allTerms.some(
        (term) =>
          term === skillLower ||
          term.includes(skillLower) ||
          skillLower.includes(term)
      );
      if (matches && !skill.blog.includes(post.slug)) {
        skill.blog.push(post.slug);
      }
    }
  }

  return Array.from(skillMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function buildExperienceEntries(
  resumeData: Record<string, any>
): ExperienceEntry[] {
  const experience = resumeData.experience || [];

  return experience.map((exp: any) => ({
    role: exp.role,
    company: exp.company,
    dateRange: `${exp.start_date}${exp.end_date ? " - " + exp.end_date : " - Present"}`,
    location: exp.location || "",
    description: exp.description || "",
    highlights: exp.highlights || []
  }));
}

// --- Main ---

async function buildContentIndex(): Promise<void> {
  console.log("Building content index...");

  // Parse resume (leader variant is the canonical one)
  const resumeData = parseResumeYaml("resume.yaml");
  if (!resumeData) {
    console.error("ERROR: Could not parse resume.yaml");
    process.exit(1);
  }

  // Build entries
  const projects = buildProjectEntries();
  console.log(`  ${projects.length} projects`);

  const blog = buildBlogEntries();
  console.log(`  ${blog.length} blog posts`);

  const experience = buildExperienceEntries(resumeData);
  console.log(`  ${experience.length} experience entries`);

  const skills = buildSkillIndex(projects, blog, resumeData.skills || {});
  console.log(`  ${skills.length} skills indexed`);

  // Build skill categories for quick reference
  const skillCategories: Record<string, string[]> = {};
  for (const [category, items] of Object.entries(
    resumeData.skills as Record<string, Array<{ name: string }>>
  )) {
    skillCategories[category] = items.map((s) => s.name);
  }

  const index: ContentIndex = {
    skills,
    experience,
    projects,
    blog,
    resume: {
      name: resumeData.name,
      title: (resumeData.jobTitles || []).join(" / "),
      tagline: resumeData.tagline || "",
      summary: resumeData.summary || "",
      location: resumeData.location || "",
      email: resumeData.email || ""
    },
    metadata: {
      buildDate: new Date().toISOString(),
      version: "1.0.0",
      projectCount: projects.length,
      blogCount: blog.length,
      skillCount: skills.length,
      experienceCount: experience.length
    }
  };

  // Write main index file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), "utf-8");
  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  console.log(`Content index written to ${OUTPUT_FILE} (${sizeKB} KB)`);

  // Create versioned filename with content hash for cache-busting
  const crypto = await import("crypto");
  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(index))
    .digest("hex")
    .substring(0, 8);

  const versionedFilename = `content-index.${contentHash}.json`;
  const versionedPath = path.join(STATIC_DIR, versionedFilename);

  fs.writeFileSync(versionedPath, JSON.stringify(index, null, 2), "utf-8");
  console.log(`Versioned index: ${versionedFilename}`);

  // Write pointer file (always fresh, short cache TTL)
  const pointerFile = path.join(STATIC_DIR, "content-index-latest.json");
  fs.writeFileSync(
    pointerFile,
    JSON.stringify(
      {
        filename: versionedFilename,
        buildDate: index.metadata.buildDate,
        version: index.metadata.version,
        hash: contentHash
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`Pointer file: content-index-latest.json → ${versionedFilename}`);
}

buildContentIndex().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
