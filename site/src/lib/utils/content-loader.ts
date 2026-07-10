import type { QuickAction, ContentMetadata } from "$lib/types";
import { parseContentMetadata } from "$lib/schemas/content";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

export type { ContentMetadata } from "$lib/types";

const CONTENT_DIR = join(process.cwd(), "content");

function parseFrontmatter(content: string, file: string): ContentMetadata | null {
  // gray-matter (already used by the content-index build step) is a real YAML
  // frontmatter parser, so multi-line, nested, quoted, and comma-containing
  // values all parse correctly instead of tripping the previous line-based
  // hand parser.
  const { data } = matter(content);
  if (!data || Object.keys(data).length === 0) return null;
  return parseContentMetadata(data, file);
}

function loadMarkdownFiles(dir: string): QuickAction[] {
  const actions: QuickAction[] = [];

  try {
    const files = readdirSync(dir);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = join(dir, file);
      const content = readFileSync(filePath, "utf-8");
      const metadata = parseFrontmatter(content, filePath);

      if (!metadata?.title) continue;

      const slug = file.replace(".md", "");
      const category = dir.endsWith("/blog") ? "blog" : "project";
      const url = dir.endsWith("/blog") ? `/blog/${slug}/` : `/projects/${slug}/`;

      const keywords = [
        category,
        ...(metadata.tags?.map((t: string) => t.toLowerCase()) || []),
        ...(metadata.keywords || []),
        slug
      ];

      actions.push({
        id: `${category}-${slug}`,
        title: metadata.title,
        description: metadata.summary,
        category,
        url,
        keywords
      });
    }
  } catch (error) {
    console.error(`Error loading files from ${dir}:`, error);
  }

  return actions;
}

/**
 * Load all blog posts and convert to QuickActions
 */
export async function loadBlogActions(): Promise<QuickAction[]> {
  const blogDir = join(CONTENT_DIR, "blog");
  return loadMarkdownFiles(blogDir);
}

/**
 * Load all projects and convert to QuickActions
 */
export async function loadProjectActions(): Promise<QuickAction[]> {
  const projectDir = join(CONTENT_DIR, "projects");
  return loadMarkdownFiles(projectDir);
}

/**
 * Load all content-based quick actions (blogs + projects)
 */
export async function loadContentActions(): Promise<QuickAction[]> {
  const [blogActions, projectActions] = await Promise.all([
    loadBlogActions(),
    loadProjectActions()
  ]);

  return [...blogActions, ...projectActions];
}
