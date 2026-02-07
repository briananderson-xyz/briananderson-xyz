import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './systemPrompt.js';
import { checkGuardrails, getRefusalMessage } from './guardrails.js';
import { ContentTools, toolDeclarations, executeToolCall } from './tools.js';

// Initialize Firebase Admin
initializeApp();

const SITE_URL = process.env.SITE_URL || 'https://briananderson.xyz';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface ChatRequest {
	message: string;
	history?: Array<{ role: string; content: string }>;
	variant?: 'leader' | 'ops' | 'builder';
}

interface FitFinderRequest {
	jobDescription: string;
	variant?: 'leader' | 'ops' | 'builder';
}

// Content index cache with versioning
let contentIndexCache: any = null;
let contentIndexVersion: string | null = null;

/**
 * Fetch content index using versioned approach to avoid stale cache
 */
async function fetchContentIndex(): Promise<any> {
	try {
		// Fetch pointer file (short cache TTL)
		const pointerResponse = await fetch(`${SITE_URL}/content-index-latest.json`);
		if (!pointerResponse.ok) {
			console.warn('Content index pointer not available:', pointerResponse.status);
			// Fallback to non-versioned
			const fallbackResponse = await fetch(`${SITE_URL}/content-index.json`);
			if (!fallbackResponse.ok) return null;
			return await fallbackResponse.json();
		}

		const pointer = await pointerResponse.json();
		const { filename, buildDate, hash } = pointer;

		// Check if we have this version cached
		if (contentIndexCache && contentIndexVersion === hash) {
			console.log('Using cached content index:', hash);
			return contentIndexCache;
		}

		// Fetch the specific versioned file (long cache TTL, immutable)
		const indexResponse = await fetch(`${SITE_URL}/${filename}`);
		if (!indexResponse.ok) {
			console.warn('Versioned content index not available:', indexResponse.status);
			return null;
		}

		contentIndexCache = await indexResponse.json();
		contentIndexVersion = hash;

		// Log freshness
		const buildTime = new Date(buildDate);
		const ageMinutes = (Date.now() - buildTime.getTime()) / 60000;
		console.log('Content index loaded:', {
			version: hash,
			buildDate,
			ageMinutes: Math.round(ageMinutes),
			skills: contentIndexCache.skills?.length,
			projects: contentIndexCache.projects?.length
		});

		if (ageMinutes > 60) {
			console.warn(`⚠️  Content index is ${Math.round(ageMinutes)} minutes old`);
		}

		return contentIndexCache;
	} catch (error) {
		console.error('Failed to fetch content index:', error);
		return null;
	}
}

function buildContextFromIndex(index: any): string {
	if (!index) return '';

	const sections: string[] = [];

	// Resume summary
	if (index.resume) {
		sections.push(`ABOUT BRIAN:
Name: ${index.resume.name}
Title: ${index.resume.title}
Location: ${index.resume.location}
Summary: ${index.resume.summary}`);
	}

	// Experience
	if (index.experience?.length > 0) {
		const expLines = index.experience.map((exp: any) =>
			`- ${exp.role} at ${exp.company} (${exp.dateRange}): ${exp.description}${exp.highlights?.length ? '\n  Key work: ' + exp.highlights.slice(0, 2).join('; ') : ''}`
		).join('\n');
		sections.push(`WORK EXPERIENCE:\n${expLines}`);
	}

	// Skills with project relationships
	if (index.skills?.length > 0) {
		const skillsWithProjects = index.skills
			.filter((s: any) => s.projects.length > 0 || s.blog.length > 0)
			.map((s: any) => {
				const refs: string[] = [];
				if (s.projects.length > 0) refs.push(`projects: ${s.projects.join(', ')}`);
				if (s.blog.length > 0) refs.push(`blog: ${s.blog.join(', ')}`);
				return `- ${s.name} [${s.category}] → ${refs.join(' | ')}`;
			}).join('\n');

		const skillsWithoutProjects = index.skills
			.filter((s: any) => s.projects.length === 0 && s.blog.length === 0)
			.map((s: any) => s.name)
			.join(', ');

		sections.push(`SKILLS WITH DOCUMENTED EVIDENCE:\n${skillsWithProjects}\n\nADDITIONAL SKILLS (from resume):\n${skillsWithoutProjects}`);
	}

	// Projects
	if (index.projects?.length > 0) {
		const projectLines = index.projects.map((p: any) =>
			`- "${p.title}" (${p.url}): ${p.summary} [Tags: ${p.tags.join(', ')}]`
		).join('\n');
		sections.push(`PROJECTS (linkable):\n${projectLines}`);
	}

	// Blog posts
	if (index.blog?.length > 0) {
		const blogLines = index.blog.map((b: any) =>
			`- "${b.title}" (${b.url}): ${b.summary || 'No summary'} [Tags: ${b.tags.join(', ')}]`
		).join('\n');
		sections.push(`BLOG POSTS (linkable):\n${blogLines}`);
	}

	return sections.join('\n\n');
}

// CORS headers
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export const chat = onRequest(
	{ 
		cors: true, 
		maxInstances: 10,
		secrets: ['GEMINI_API_KEY']
	},
	async (req, res) => {
		// Handle preflight
		if (req.method === 'OPTIONS') {
			res.set(corsHeaders);
			res.status(204).send('');
			return;
		}

		if (req.method !== 'POST') {
			res.status(405).json({ error: 'Method not allowed' });
			return;
		}

		try {
			const { message, history = [] }: ChatRequest = req.body;

			if (!message || typeof message !== 'string') {
				res.status(400).json({ error: 'Message is required' });
				return;
			}

			// Check guardrails
			const guardrailCheck = checkGuardrails(message);
			if (!guardrailCheck.allowed) {
				res.set(corsHeaders);
				res.status(200).json({
					response: getRefusalMessage(guardrailCheck.reason || 'unknown'),
					blocked: true
				});
				return;
			}

			// Require Gemini API key
			if (!GEMINI_API_KEY) {
				console.error('GEMINI_API_KEY not configured');
				res.status(503).json({
					error: 'AI service not configured',
					details: 'Chat service is temporarily unavailable'
				});
				return;
			}

			// Fetch content index for tool-based responses
			const contentIndex = await fetchContentIndex();
			const tools = contentIndex ? new ContentTools(contentIndex) : null;

			const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
			const model = genAI.getGenerativeModel({
				model: 'gemini-2.5-flash',
				systemInstruction: getSystemPrompt(SITE_URL),
				tools: tools ? [toolDeclarations] : undefined,
				generationConfig: {
					maxOutputTokens: 1000,
					temperature: 0.7,
				},
			});

			// Convert history to Gemini format
			const chatHistory = history.map((msg) => ({
				role: msg.role === 'user' ? 'user' : 'model',
				parts: [{ text: msg.content }],
			}));

			// Start chat with history
			const chat = model.startChat({
				history: chatHistory as any,
			});

			// Send message and get response
			let result = await chat.sendMessage(message);

			// Handle function calls if tools are available
			if (tools) {
				let maxIterations = 5;
				while (result.response.functionCalls() && maxIterations > 0) {
					maxIterations--;

					const functionCalls = result.response.functionCalls();
					console.log('Chat function calls:', functionCalls.map(fc => fc.name));

					const functionResponses = functionCalls.map(fc => {
						const toolResult = executeToolCall(tools, fc.name, fc.args);
						return {
							functionResponse: {
								name: fc.name,
								response: toolResult
							}
						};
					});

					result = await chat.sendMessage(functionResponses);
				}
			}

			const response = result.response.text();

			res.set(corsHeaders);
			res.status(200).json({
				response
			});

		} catch (error) {
			console.error('Chat error:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	}
);

export const fitFinder = onRequest(
	{ 
		cors: true, 
		maxInstances: 10,
		secrets: ['GEMINI_API_KEY']
	},
	async (req, res) => {
		// Handle preflight
		if (req.method === 'OPTIONS') {
			res.set(corsHeaders);
			res.status(204).send('');
			return;
		}

		if (req.method !== 'POST') {
			res.status(405).json({ error: 'Method not allowed' });
			return;
		}

		try {
			const { jobDescription, variant = 'leader' }: FitFinderRequest = req.body;

			if (!jobDescription || typeof jobDescription !== 'string') {
				res.status(400).json({ error: 'Job description is required' });
				return;
			}

			// Require Gemini API key
			if (!GEMINI_API_KEY) {
				console.error('GEMINI_API_KEY not configured');
				res.status(503).json({
					error: 'AI service not configured',
					details: 'Fit Finder service is temporarily unavailable'
				});
				return;
			}

			// Fetch content index for tool-based analysis
			const contentIndex = await fetchContentIndex();

			if (!contentIndex) {
				res.status(503).json({
					error: 'Content index unavailable',
					details: 'Unable to load Brian\'s background data for analysis'
				});
				return;
			}

			// Initialize tools
			const tools = new ContentTools(contentIndex);

			const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
			const model = genAI.getGenerativeModel({
				model: 'gemini-2.5-flash',
				tools: [toolDeclarations],
				generationConfig: {
					maxOutputTokens: 2000,
					temperature: 0.5,
				},
			});

			const initialPrompt = `You are analyzing a job description to determine if Brian Anderson is a good fit.

You have access to tools that let you search Brian's skills, projects, and experience. Use these tools to gather evidence before making your assessment.

Job Description:
${jobDescription}

WORKFLOW:
1. Use search_skills() to find relevant technical and soft skills
2. Use search_projects() and get_project() to find relevant project work
3. Use search_experience() to find relevant roles and companies
4. Use get_resume_summary() for overview information

CRITICAL RULES FOR FINAL RESPONSE:
1. ONLY cite skills, experience, and projects you found via tool calls
2. Every "url" field MUST be from the tool results - do NOT invent URLs
3. If a skill has no project/blog evidence, omit the "url" field
4. Be humble and honest - acknowledge gaps rather than overselling
5. The "analysis" field should be a natural 2-3 paragraph narrative

After gathering information with tools, respond with a JSON object (no markdown, just raw JSON):
{
  "fitScore": <number 0-100>,
  "fitLevel": "<good|maybe|not>",
  "confidence": "<high|medium|low>",
  "matchingSkills": [
    {
      "name": "<skill name from tool results>",
      "url": "<project/blog URL from tool results, or omit if none>",
      "context": "<how/where Brian used this skill>"
    }
  ],
  "matchingExperience": [
    {
      "role": "<exact role from search_experience>",
      "company": "<company name>",
      "dateRange": "<date range from results>",
      "url": "<project URL if relevant, or omit>",
      "relevance": "<why this role is relevant>"
    }
  ],
  "gaps": ["<specific job requirements not found in Brian's background>"],
  "analysis": "<2-3 paragraph narrative explaining fit, using specific evidence from tool calls. Be informative and humble. Acknowledge gaps without dwelling on them. End with potential value Brian could bring.>",
  "resumeVariantRecommendation": "<leader|ops|builder>",
  "cta": {
    "text": "Connect with Brian",
    "link": "mailto:brian@briananderson.xyz"
  }
}

FIT LEVELS:
- "good" (80-100): Strong alignment, core requirements well-covered
- "maybe" (50-79): Partial alignment, transferable skills present
- "not" (0-49): Significant gaps in critical requirements`;

			// Start conversation with tools
			const chat = model.startChat();
			let result = await chat.sendMessage(initialPrompt);

			// Handle function calls in a loop
			let maxIterations = 10;
			while (result.response.functionCalls() && maxIterations > 0) {
				maxIterations--;

				const functionCalls = result.response.functionCalls();
				console.log('Function calls requested:', functionCalls.map(fc => fc.name));

				// Execute all function calls
				const functionResponses = functionCalls.map(fc => {
					const toolResult = executeToolCall(tools, fc.name, fc.args);
					return {
						functionResponse: {
							name: fc.name,
							response: toolResult
						}
					};
				});

				// Send function results back to model
				result = await chat.sendMessage(functionResponses);
			}

			const response = result.response.text();

			// Parse JSON response
			const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const analysis = JSON.parse(jsonStr);

			res.set(corsHeaders);
			res.status(200).json({
				analysis
			});

		} catch (error) {
			console.error('Fit finder error:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	}
);
