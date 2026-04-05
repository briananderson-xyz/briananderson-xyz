/**
 * Tool definitions for Gemini function calling
 *
 * These tools allow the AI to query Brian's content index intelligently,
 * fetching only the information it needs for analysis.
 */

import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import type {
	ContentIndex,
	SkillResult,
	ProjectEntry,
	ProjectResult,
	ExperienceResult,
	ResumeSummary,
	ToolExecutionArgs
} from './types.js';

/**
 * Tool function implementations
 */
export class ContentTools {
	private index: ContentIndex;

	constructor(contentIndex: ContentIndex) {
		this.index = contentIndex;
	}

	/**
	 * Search for skills by keywords
	 */
	searchSkills(keywords: string[]): SkillResult[] {
		if (!this.index?.skills) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.skills
			.filter((skill) => {
				const skillName = skill.name.toLowerCase();
				const category = skill.category?.toLowerCase() || '';

				return keywordsLower.some(keyword =>
					skillName.includes(keyword) ||
					category.includes(keyword) ||
					keyword.includes(skillName)
				);
			})
			.map((skill) => ({
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
	getProject(slug: string): ProjectEntry | null {
		if (!this.index?.projects) return null;

		return this.index.projects.find((p) => p.slug === slug) || null;
	}

	/**
	 * Search projects by keywords or tags
	 */
	searchProjects(keywords: string[]): ProjectResult[] {
		if (!this.index?.projects) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.projects
			.filter((project) => {
				const searchText = `${project.title} ${project.summary} ${project.tags.join(' ')} ${project.keywords.join(' ')}`.toLowerCase();
				return keywordsLower.some(keyword => searchText.includes(keyword));
			})
			.map((project) => ({
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
	searchExperience(keywords: string[]): ExperienceResult[] {
		if (!this.index?.experience) return [];

		const keywordsLower = keywords.map(k => k.toLowerCase());

		return this.index.experience
			.filter((exp) => {
				const searchText = `${exp.role} ${exp.company} ${exp.description} ${exp.highlights.join(' ')}`.toLowerCase();
				return keywordsLower.some(keyword => searchText.includes(keyword));
			})
			.map((exp) => ({
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
	getSkillsByCategory(category: string): Pick<SkillResult, 'name' | 'projects' | 'blog'>[] {
		if (!this.index?.skills) return [];

		const categoryLower = category.toLowerCase();

		return this.index.skills
			.filter((skill) => skill.category?.toLowerCase().includes(categoryLower))
			.map((skill) => ({
				name: skill.name,
				projects: skill.projects,
				blog: skill.blog
			}));
	}

	/**
	 * Get Brian's resume summary
	 */
	getResumeSummary(): ResumeSummary | null {
		if (!this.index?.resume) return null;

		return {
			name: this.index.resume.name,
			title: this.index.resume.title,
			location: this.index.resume.location,
			email: this.index.resume.email,
			tagline: this.index.resume.tagline,
			summary: this.index.resume.summary,
			skillCategories: Object.keys(this.index.resume.skillCategories || {}),
			certificates: this.index.resume.certificates || []
		};
	}
}

/**
 * Tool declarations for Gemini
 */
export const toolDeclarations: { functionDeclarations: FunctionDeclaration[] } = {
	functionDeclarations: [
		{
			name: 'search_skills',
			description: 'Search for skills by keywords. Use this to find if Brian has specific technical or soft skills. Returns skills with evidence (projects/blog posts where used).',
			parameters: {
				type: Type.OBJECT,
				properties: {
					keywords: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
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
				type: Type.OBJECT,
				properties: {
					slug: {
						type: Type.STRING,
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
				type: Type.OBJECT,
				properties: {
					keywords: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
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
				type: Type.OBJECT,
				properties: {
					keywords: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
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
				type: Type.OBJECT,
				properties: {
					category: {
						type: Type.STRING,
						description: 'Category name (e.g., "Cloud Platforms", "AI Agent Frameworks")'
					}
				},
				required: ['category']
			}
		},
		{
			name: 'get_resume_summary',
			description: 'Get Brian\'s resume summary including name, title, location, tagline, overview, skill categories, and certifications.',
			parameters: {
				type: Type.OBJECT,
				properties: {}
			}
		}
	]
};

/**
 * Tool declaration for structured fit analysis submission.
 * The model calls this as its final action; the SDK enforces the parameter schema.
 */
export const submitAnalysisDeclaration: FunctionDeclaration = {
	name: 'submit_analysis',
	description: 'Submit the final fit analysis after gathering evidence. Call ONCE as your final action.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			fitScore: { type: Type.NUMBER, description: '0-100' },
			fitLevel: { type: Type.STRING, description: '"good" (80-100), "maybe" (50-79), "not" (0-49)' },
			confidence: { type: Type.STRING, description: '"high", "medium", or "low"' },
			matchingSkills: {
				type: Type.ARRAY,
				items: {
					type: Type.OBJECT,
					properties: {
						name: { type: Type.STRING },
						url: { type: Type.STRING },
						context: { type: Type.STRING }
					},
					required: ['name']
				}
			},
			matchingExperience: {
				type: Type.ARRAY,
				items: {
					type: Type.OBJECT,
					properties: {
						role: { type: Type.STRING },
						company: { type: Type.STRING },
						dateRange: { type: Type.STRING },
						url: { type: Type.STRING },
						relevance: { type: Type.STRING }
					},
					required: ['role', 'company', 'dateRange', 'relevance']
				}
			},
			gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
			analysis: { type: Type.STRING, description: '2-3 paragraph narrative' },
			resumeVariantRecommendation: { type: Type.STRING, description: '"leader", "ops", or "builder"' },
			cta: {
				type: Type.OBJECT,
				properties: {
					text: { type: Type.STRING },
					link: { type: Type.STRING }
				},
				required: ['text', 'link']
			}
		},
		required: ['fitScore', 'fitLevel', 'confidence', 'matchingSkills',
			'matchingExperience', 'gaps', 'analysis', 'resumeVariantRecommendation', 'cta']
	}
};

function normalizeToolName(functionName: string): string {
	return functionName.toLowerCase().replace(/[^a-z]/g, '');
}

export function isSubmitAnalysisCall(functionName: string): boolean {
	return normalizeToolName(functionName).startsWith('submitanalysis');
}

/**
 * Execute a tool function call
 */
export function executeToolCall(
	tools: ContentTools,
	functionName: string,
	args: ToolExecutionArgs
): SkillResult[] | ProjectEntry | ProjectResult[] | ExperienceResult[] | Pick<SkillResult, 'name' | 'projects' | 'blog'>[] | ResumeSummary | ToolExecutionArgs | null {
	if (isSubmitAnalysisCall(functionName)) {
		return args;
	}

	switch (functionName) {
		case 'search_skills':
			return tools.searchSkills(args.keywords || []);
		case 'get_project':
			return tools.getProject(args.slug || '');
		case 'search_projects':
			return tools.searchProjects(args.keywords || []);
		case 'search_experience':
			return tools.searchExperience(args.keywords || []);
		case 'get_skills_by_category':
			return tools.getSkillsByCategory(args.category || '');
		case 'get_resume_summary':
			return tools.getResumeSummary();
		default:
			throw new Error(`Unknown tool: ${functionName}`);
	}
}
