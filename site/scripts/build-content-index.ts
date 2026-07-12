/**
 * Build-time Content Indexer for Fit Finder RAG System
 *
 * Parses all markdown content (projects, blog posts) and resume YAML files,
 * builds skill-to-content relationships, and outputs a structured JSON index
 * to static/content-index.json for the Cloud Run API to consume.
 *
 * Run: pnpm build-content-index
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { parseContentMetadata, type ContentMetadata } from "../src/lib/schemas/content.ts";
import { ResumeSchema, type Resume, type SkillItem } from "../src/lib/schemas/resume.ts";

const SITE_URL = "https://briananderson.xyz";
const CONTENT_DIR = path.join(process.cwd(), "content");
const STATIC_DIR = path.join(process.cwd(), "static");
const OUTPUT_FILE = path.join(STATIC_DIR, "content-index.json");
const VERSIONED_INDEX_PATTERN = /^content-index\.[a-f0-9]{8}\.json$/;

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
    certificates: string[];
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
  id: string;
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
  projectDate?: string;
  eventPeriod?: string;
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
  projectDate?: string;
  eventPeriod?: string;
}

// --- Parsing ---

function parseMarkdownFiles(
  dir: string
): Array<{ slug: string; frontmatter: ContentMetadata; content: string }> {
  const results: Array<{
    slug: string;
    frontmatter: ContentMetadata;
    content: string;
  }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`  ⚠ Directory not found: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(dir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const frontmatter = parseContentMetadata(data, filePath);
    const slug = file.replace(/\.md$/, "");
    results.push({ slug, frontmatter, content });
  }

  return results;
}

function parseResumeYaml(filename: string): Resume | null {
  const filePath = path.join(CONTENT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Resume not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return ResumeSchema.parse(yaml.load(content));
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

  return plain.length > maxLength ? plain.slice(0, maxLength) + "..." : plain;
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
      date: frontmatter.updated || frontmatter.date,
      projectDate: frontmatter.projectDate,
      eventPeriod: frontmatter.eventPeriod,
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
      date: frontmatter.updated || frontmatter.date,
      projectDate: frontmatter.projectDate,
      eventPeriod: frontmatter.eventPeriod
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildSkillIndex(
  projects: ProjectEntry[],
  blog: BlogEntry[],
  resumeSkills: Record<string, SkillItem[]>
): SkillEntry[] {
  const skillMap = new Map<string, SkillEntry>();
  const aliases = new Map<string, string>();

  const registerAlias = (alias: string, id: string): void => {
    const key = alias.trim().toLocaleLowerCase("en-US");
    const existing = aliases.get(key);
    if (existing && existing !== id) {
      throw new Error(`Skill alias "${alias}" is assigned to both "${existing}" and "${id}"`);
    }
    aliases.set(key, id);
  };

  // Seed from resume skills (authoritative list)
  for (const [category, skills] of Object.entries(resumeSkills)) {
    for (const skill of skills) {
      if (!skill.id) {
        throw new Error(`Canonical resume skill "${skill.name}" is missing a stable id`);
      }
      if (!skillMap.has(skill.id)) {
        skillMap.set(skill.id, {
          id: skill.id,
          name: skill.name,
          category,
          projects: [],
          blog: []
        });
      }
      registerAlias(skill.id, skill.id);
      registerAlias(skill.name, skill.id);
      if (skill.altName) registerAlias(skill.altName, skill.id);
      for (const alias of skill.aliases || []) registerAlias(alias, skill.id);
    }
  }

  const evidenceIds = (entry: ProjectEntry | BlogEntry, explicit?: string[]): string[] => {
    const terms = explicit || [...entry.tags, ...entry.keywords];
    const ids = new Set<string>();
    for (const term of terms) {
      const id = explicit?.length ? term : aliases.get(term.trim().toLocaleLowerCase("en-US"));
      if (id && skillMap.has(id)) ids.add(id);
      else if (explicit?.length)
        throw new Error(`${entry.slug} references unknown skill id "${term}"`);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  };

  const projectMetadata = new Map(
    parseMarkdownFiles(path.join(CONTENT_DIR, "projects")).map(({ slug, frontmatter }) => [
      slug,
      frontmatter
    ])
  );
  const blogMetadata = new Map(
    parseMarkdownFiles(path.join(CONTENT_DIR, "blog")).map(({ slug, frontmatter }) => [
      slug,
      frontmatter
    ])
  );

  // Evidence is either an explicit canonical id or an exact, resume-owned alias.
  for (const project of projects) {
    const metadata = projectMetadata.get(project.slug);
    for (const id of evidenceIds(project, metadata?.skills)) {
      skillMap.get(id)?.projects.push(project.slug);
    }
  }

  for (const post of blog) {
    const metadata = blogMetadata.get(post.slug);
    for (const id of evidenceIds(post, metadata?.skills)) {
      skillMap.get(id)?.blog.push(post.slug);
    }
  }

  return Array.from(skillMap.values())
    .map((skill) => ({
      ...skill,
      projects: skill.projects.sort((a, b) => a.localeCompare(b)),
      blog: skill.blog.sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildExperienceEntries(resumeData: Resume): ExperienceEntry[] {
  return resumeData.experience.map((exp) => ({
    role: exp.role,
    company: exp.company,
    dateRange: `${exp.start_date}${exp.end_date ? " - " + exp.end_date : " - Present"}`,
    location: exp.location || "",
    description: exp.description || "",
    highlights: exp.highlights.map((highlight) =>
      typeof highlight === "string" ? highlight : highlight.text
    )
  }));
}

function sourceDate(projects: ProjectEntry[], blog: BlogEntry[]): string {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch) {
    const seconds = Number(epoch);
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new Error("SOURCE_DATE_EPOCH must be a non-negative integer number of seconds");
    }
    return new Date(seconds * 1000).toISOString();
  }
  const latest = [...projects, ...blog]
    .map((entry) => entry.date)
    .sort()
    .at(-1);
  if (!latest) throw new Error("Cannot derive source date without content or SOURCE_DATE_EPOCH");
  return `${latest}T00:00:00.000Z`;
}

// --- Main ---

async function buildContentIndex(): Promise<void> {
  console.log("Building content index...");

  // Every hashed file except the current index is stale. The pointer is the compatibility boundary.
  const pointerFile = path.join(STATIC_DIR, "content-index-latest.json");

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
  for (const [category, items] of Object.entries(resumeData.skills)) {
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
      email: resumeData.email || "",
      skillCategories,
      certificates: Array.isArray(resumeData.certificates)
        ? resumeData.certificates.map((cert: { name?: string }) => cert.name || "").filter(Boolean)
        : []
    },
    metadata: {
      buildDate: sourceDate(projects, blog),
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

  const retainedVersionedFiles = new Set([versionedFilename]);
  for (const filename of fs.readdirSync(STATIC_DIR).sort((a, b) => a.localeCompare(b))) {
    if (VERSIONED_INDEX_PATTERN.test(filename) && !retainedVersionedFiles.has(filename)) {
      fs.rmSync(path.join(STATIC_DIR, filename));
      console.log(`Removed stale versioned index: ${filename}`);
    }
  }
}

buildContentIndex().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
