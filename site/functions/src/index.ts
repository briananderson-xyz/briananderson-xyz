import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { GoogleGenAI } from '@google/genai';
import { getSystemPrompt } from './systemPrompt.js';
import { checkGuardrails, getRefusalMessage } from './guardrails.js';
import { ContentTools, toolDeclarations, submitAnalysisDeclaration, executeToolCall } from './tools.js';
import type {
	ContentIndex,
	ContentIndexPointer,
	ChatRequest,
	FitFinderRequest
} from './types.js';

// Initialize Firebase Admin
initializeApp();

const SITE_URL = process.env.SITE_URL || 'https://briananderson.xyz';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Tool call iteration limits
const MAX_CHAT_TOOL_ITERATIONS = 5;
const MAX_FIT_FINDER_TOOL_ITERATIONS = 10;

// Content index cache with versioning
let contentIndexCache: ContentIndex | null = null;
let contentIndexVersion: string | null = null;

/**
 * Fetch content index using versioned approach to avoid stale cache
 */
async function fetchContentIndex(): Promise<ContentIndex | null> {
	try {
		// Fetch pointer file (short cache TTL)
		const pointerResponse = await fetch(`${SITE_URL}/content-index-latest.json`);
		if (!pointerResponse.ok) {
			if (!IS_PRODUCTION) {
				console.warn('Content index pointer not available:', pointerResponse.status);
			}
			// Fallback to non-versioned
			const fallbackResponse = await fetch(`${SITE_URL}/content-index.json`);
			if (!fallbackResponse.ok) return null;
			return await fallbackResponse.json() as ContentIndex;
		}

		const pointer = await pointerResponse.json() as ContentIndexPointer;
		const { filename, buildDate, hash } = pointer;

		// Check if we have this version cached
		if (contentIndexCache && contentIndexVersion === hash) {
			if (!IS_PRODUCTION) {
				console.log('Using cached content index:', hash);
			}
			return contentIndexCache;
		}

		// Fetch the specific versioned file (long cache TTL, immutable)
		const indexResponse = await fetch(`${SITE_URL}/${filename}`);
		if (!indexResponse.ok) {
			if (!IS_PRODUCTION) {
				console.warn('Versioned content index not available:', indexResponse.status);
			}
			return null;
		}

		contentIndexCache = await indexResponse.json() as ContentIndex;
		contentIndexVersion = hash;

		// Log freshness (only in development)
		if (!IS_PRODUCTION) {
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
		}

		return contentIndexCache;
	} catch (error) {
		console.error('Failed to fetch content index:', error);
		return null;
	}
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
			const contentTools = contentIndex ? new ContentTools(contentIndex) : null;

			const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

			// Convert history to Gemini format
			const chatHistory = history.map((msg) => ({
				role: msg.role === 'user' ? ('user' as const) : ('model' as const),
				parts: [{ text: msg.content }],
			}));

			// Start chat with history
			const chat = ai.chats.create({
				model: 'gemini-2.5-flash',
				config: {
					systemInstruction: getSystemPrompt(SITE_URL),
					tools: contentTools ? [toolDeclarations] : undefined,
					maxOutputTokens: 1000,
					temperature: 0.7,
				},
				history: chatHistory,
			});

			// Send message and get response
			let result = await chat.sendMessage({ message });

			// Handle function calls if tools are available
			if (contentTools) {
				let maxIterations = MAX_CHAT_TOOL_ITERATIONS;
				while (result.functionCalls && maxIterations > 0) {
					maxIterations--;

					const functionCalls = result.functionCalls;
					if (!IS_PRODUCTION) {
						console.log('Chat function calls:', functionCalls.map(fc => fc.name));
					}

					const functionResponses = functionCalls.map(fc => {
						const toolResult = executeToolCall(contentTools, fc.name!, fc.args);
						return {
							functionResponse: {
								id: fc.id,
								name: fc.name,
								response: { output: toolResult }
							}
						};
					});

					result = await chat.sendMessage({ message: functionResponses });
				}
			}

			const response = result.text;

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
			const { jobDescription, variant: _variant = 'leader' }: FitFinderRequest = req.body;

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
			const contentTools = new ContentTools(contentIndex);

			const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

			const fitFinderTools = {
				functionDeclarations: [...toolDeclarations.functionDeclarations, submitAnalysisDeclaration]
			};

			const initialPrompt = `You are analyzing a job description to determine if Brian Anderson is a good fit.

You have access to tools that let you search Brian's skills, projects, and experience. Use these tools to gather evidence before making your assessment.

Job Description:
${jobDescription}

WORKFLOW:
1. Use search_skills() to find relevant technical and soft skills
2. Use search_projects() and get_project() to find relevant project work
3. Use search_experience() to find relevant roles and companies
4. Use get_resume_summary() for overview information
5. Call submit_analysis() with your structured assessment as your FINAL action

CRITICAL RULES:
1. ONLY cite skills, experience, and projects you found via tool calls
2. Every "url" field MUST be from the tool results - do NOT invent URLs
3. If a skill has no project/blog evidence, omit the "url" field
4. Be humble and honest - acknowledge gaps rather than overselling
5. The "analysis" field should be a natural, recruiter-readable narrative in 2 short paragraphs
6. The first paragraph should summarize overall fit in plain English
7. The second paragraph should highlight strongest evidence and the most important gap(s)
8. Do NOT expose internal resume variant terminology in the narrative
9. Do NOT use hype language or claim fit without evidence
10. You MUST call submit_analysis() as your final action - do NOT return plain text

OUTPUT QUALITY:
- matchingSkills should be relevant, not exhaustive
- matchingExperience should emphasize role relevance, not just role titles
- gaps should name real missing requirements or domain gaps, not filler
- fitScore should be conservative when critical requirements are missing
- confidence should reflect evidence quality, not optimism
- cta should be useful but understated

FIT LEVELS:
- "good" (80-100): Strong alignment, core requirements well-covered
- "maybe" (50-79): Partial alignment, transferable skills present
- "not" (0-49): Significant gaps in critical requirements`;

			// Start conversation with tools
			const chat = ai.chats.create({
				model: 'gemini-2.5-flash',
				config: {
					tools: [fitFinderTools],
					maxOutputTokens: 2000,
					temperature: 0.5,
				},
			});
			let result = await chat.sendMessage({ message: initialPrompt });

			// Handle function calls in a loop, intercept submit_analysis
			let analysis: Record<string, unknown> | null = null;
			let maxIterations = MAX_FIT_FINDER_TOOL_ITERATIONS;
			while (maxIterations > 0) {
				maxIterations--;

				const functionCalls = result.functionCalls;
				if (!functionCalls || functionCalls.length === 0) {
					// No more function calls — check for text fallback
					break;
				}

				if (!IS_PRODUCTION) {
					console.log('Function calls requested:', functionCalls.map(fc => fc.name));
				}

				// Check if submit_analysis was called (may appear alongside other calls)
				const submitCall = functionCalls.find(fc => fc.name === 'submit_analysis');
				if (submitCall) {
					analysis = submitCall.args;
					break;
				}

				// Execute all other function calls
				const functionResponses = functionCalls.map(fc => {
					const toolResult = executeToolCall(contentTools, fc.name!, fc.args);
					return {
						functionResponse: {
							id: fc.id,
							name: fc.name,
							response: { output: toolResult }
						}
					};
				});

				// Send function results back to model
				result = await chat.sendMessage({ message: functionResponses });
			}

			// Fallback: if model returned text instead of calling submit_analysis
			if (!analysis && result.text) {
				if (!IS_PRODUCTION) {
					console.warn('Model returned text instead of calling submit_analysis, attempting JSON parse');
				}
				try {
					const response = result.text;
					const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
					analysis = JSON.parse(jsonStr);
				} catch (parseErr) {
					if (!IS_PRODUCTION) {
						console.error('Failed to parse fallback text as JSON:', result.text?.substring(0, 200));
					}
				}
			}

			if (!analysis) {
				throw new Error('Model did not produce a fit analysis');
			}

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
