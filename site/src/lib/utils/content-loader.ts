import type { QuickAction, ContentMetadata } from '$lib/types';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export type { ContentMetadata } from '$lib/types';

const CONTENT_DIR = join(process.cwd(), 'content');

function parseFrontmatter(content: string): ContentMetadata | null {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	const frontmatter: Record<string, string | string[]> = {};
	const lines = match[1].split('\n');

	for (const line of lines) {
		const colonIndex = line.indexOf(':');
		if (colonIndex > 0) {
			const key = line.slice(0, colonIndex).trim();
			const raw = line.slice(colonIndex + 1).trim();

			// Handle array values
			if (raw.startsWith('[') && raw.endsWith(']')) {
				frontmatter[key] = raw.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
			} else {
				frontmatter[key] = raw;
			}
		}
	}

	return frontmatter as unknown as ContentMetadata;
}

function loadMarkdownFiles(dir: string): QuickAction[] {
	const actions: QuickAction[] = [];
	
	try {
		const files = readdirSync(dir);
		
		for (const file of files) {
			if (!file.endsWith('.md')) continue;
			
			const filePath = join(dir, file);
			const content = readFileSync(filePath, 'utf-8');
			const metadata = parseFrontmatter(content);
			
			if (!metadata?.title) continue;
			
			const slug = file.replace('.md', '');
			const category = dir.endsWith('/blog') ? 'blog' : 'project';
			const url = dir.endsWith('/blog') ? `/blog/${slug}/` : `/projects/${slug}/`;
			
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
	const blogDir = join(CONTENT_DIR, 'blog');
	return loadMarkdownFiles(blogDir);
}

/**
 * Load all projects and convert to QuickActions
 */
export async function loadProjectActions(): Promise<QuickAction[]> {
	const projectDir = join(CONTENT_DIR, 'projects');
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
