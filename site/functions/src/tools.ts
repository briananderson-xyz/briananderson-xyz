/**
 * Tool definitions for Gemini function calling
 *
 * These tools allow the AI to query Brian's content index intelligently,
 * fetching only the information it needs for analysis.
 */

import type { FunctionDeclarationsTool } from '@google/generative-ai';

/**
 * Tool function implementations
 */
export class ContentTools {
	private index: any;

	constructor(contentIndex: any) {
		this.index = contentIndex;
	}

	/**
	 * Search for skills by keywords
	 */
	searchSkills(keywords: string[]): any[] {
		if (!this.index?.skills) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.skills
			.filter((skill: any) => {
				const skillName = skill.name.toLowerCase();
				const category = skill.category?.toLowerCase() || '';

				return keywordsLower.some(keyword =>
					skillName.includes(keyword) ||
					category.includes(keyword) ||
					keyword.includes(skillName)
				);
			})
			.map((skill: any) => ({
				name: skill.name,
				category: skill.category,
				projects: skill.projects,
				blog: skill.blog,
				hasEvidence: skill.projects.length > 0 || skill.blog.length > 0
			}));
	}

	/**
	 * Get project details by slug
	 */
	getProject(slug: string): any {
		if (!this.index?.projects) return null;

		return this.index.projects.find((p: any) => p.slug === slug);
	}

	/**
	 * Search projects by keywords or tags
	 */
	searchProjects(keywords: string[]): any[] {
		if (!this.index?.projects) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.projects
			.filter((project: any) => {
				const searchText = `${project.title} ${project.summary} ${project.tags.join(' ')} ${project.keywords.join(' ')}`.toLowerCase();
				return keywordsLower.some(keyword => searchText.includes(keyword));
			})
			.map((project: any) => ({
				slug: project.slug,
				title: project.title,
				url: project.url,
				summary: project.summary,
				tags: project.tags,
				date: project.date
			}));
	}

	/**
	 * Search experience by role or company keywords
	 */
	searchExperience(keywords: string[]): any[] {
		if (!this.index?.experience) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.experience
			.filter((exp: any) => {
				const searchText = `${exp.role} ${exp.company} ${exp.description} ${exp.highlights.join(' ')}`.toLowerCase();
				return keywordsLower.some(keyword => searchText.includes(keyword));
			})
			.map((exp: any) => ({
				role: exp.role,
				company: exp.company,
				dateRange: exp.dateRange,
				location: exp.location,
				description: exp.description,
				highlights: exp.highlights.slice(0, 3) // Limit to top 3 highlights
			}));
	}

	/**
	 * Get all skills in a specific category
	 */
	getSkillsByCategory(category: string): any[] {
		if (!this.index?.skills) return [];

		const categoryLower = category.toLowerCase();

		return this.index.skills
			.filter((skill: any) => skill.category?.toLowerCase().includes(categoryLower))
			.map((skill: any) => ({
				name: skill.name,
				projects: skill.projects,
				blog: skill.blog
			}));
	}

	/**
	 * Get Brian's resume summary
	 */
	getResumeSummary(): any {
		if (!this.index?.resume) return null;

		return {
			name: this.index.resume.name,
			title: this.index.resume.title,
			location: this.index.resume.location,
			email: this.index.resume.email,
			tagline: this.index.resume.tagline,
			summary: this.index.resume.summary,
			skillCategories: Object.keys(this.index.resume.skillCategories || {})
		};
	}
}

/**
 * Tool declarations for Gemini
 */
export const toolDeclarations: FunctionDeclarationsTool = {
	functionDeclarations: [
		{
			name: 'search_skills',
			description: 'Search for skills by keywords. Use this to find if Brian has specific technical or soft skills. Returns skills with evidence (projects/blog posts where used).',
			parameters: {
				type: 'object' as const,
				properties: {
					keywords: {
						type: 'array' as const,
						items: { type: 'string' as const },
						description: 'Keywords to search for (e.g., ["kubernetes", "aws", "leadership"])'
					}
				},
				required: ['keywords']
			}
		},
		{
			name: 'get_project',
			description: 'Get detailed information about a specific project by its slug. Use this after search_projects to get full details.',
			parameters: {
				type: 'object' as const,
				properties: {
					slug: {
						type: 'string' as const,
						description: 'Project slug (e.g., "gfs-cloud-enablement")'
					}
				},
				required: ['slug']
			}
		},
		{
			name: 'search_projects',
			description: 'Search for projects by keywords or technologies. Returns list of relevant projects with summaries.',
			parameters: {
				type: 'object' as const,
				properties: {
					keywords: {
						type: 'array' as const,
						items: { type: 'string' as const },
						description: 'Keywords to search for (e.g., ["cloud", "kubernetes", "migration"])'
					}
				},
				required: ['keywords']
			}
		},
		{
			name: 'search_experience',
			description: 'Search work experience by role, company, or keywords. Returns relevant experience entries.',
			parameters: {
				type: 'object' as const,
				properties: {
					keywords: {
						type: 'array' as const,
						items: { type: 'string' as const },
						description: 'Keywords to search for (e.g., ["technical director", "aws", "platform"])'
					}
				},
				required: ['keywords']
			}
		},
		{
			name: 'get_skills_by_category',
			description: 'Get all skills in a specific category (e.g., "Cloud Platforms", "Leadership", "Languages").',
			parameters: {
				type: 'object' as const,
				properties: {
					category: {
						type: 'string' as const,
						description: 'Category name (e.g., "Cloud Platforms", "AI Agent Frameworks")'
					}
				},
				required: ['category']
			}
		},
		{
			name: 'get_resume_summary',
			description: 'Get Brian\'s resume summary including name, title, location, tagline, and overview.',
			parameters: {
				type: 'object' as const,
				properties: {}
			}
		}
	]
};

/**
 * Execute a tool function call
 */
export function executeToolCall(
	tools: ContentTools,
	functionName: string,
	args: any
): any {
	switch (functionName) {
		case 'search_skills':
			return tools.searchSkills(args.keywords);
		case 'get_project':
			return tools.getProject(args.slug);
		case 'search_projects':
			return tools.searchProjects(args.keywords);
		case 'search_experience':
			return tools.searchExperience(args.keywords);
		case 'get_skills_by_category':
			return tools.getSkillsByCategory(args.category);
		case 'get_resume_summary':
			return tools.getResumeSummary();
		default:
			throw new Error(`Unknown tool: ${functionName}`);
	}
}
