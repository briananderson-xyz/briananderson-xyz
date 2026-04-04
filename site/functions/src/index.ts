import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { GoogleGenAI } from '@google/genai';
import { getSystemPrompt } from './systemPrompt.js';
import { checkGuardrails, getRefusalMessage } from './guardrails.js';
import { ContentTools, toolDeclarations, submitAnalysisDeclaration, executeToolCall, isSubmitAnalysisCall } from './tools.js';
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

function unique<T>(values: T[]): T[] {
	return [...new Set(values)];
}

function detectRoleFamily(jobDescription: string): 'leader' | 'ops' | 'builder' {
	const lower = jobDescription.toLowerCase();

	const builderSignals = [
		'full stack', 'full-stack', 'typescript', 'javascript', 'react', 'node',
		'product-minded', 'product engineering', 'developer workflow', 'developer productivity',
		'application engineer', 'frontend', 'backend'
	];
	const opsSignals = [
		'platform', 'devops', 'sre', 'kubernetes', 'terraform', 'infrastructure',
		'ci/cd', 'cloud', 'migration', 'reliability'
	];
	const leaderSignals = [
		'architect', 'strategy', 'director', 'leadership', 'transformation',
		'enterprise', 'stakeholder', 'multi-team'
	];

	const hasBuilder = builderSignals.some((signal) => lower.includes(signal));
	const hasOps = opsSignals.some((signal) => lower.includes(signal));
	const hasLeader = leaderSignals.some((signal) => lower.includes(signal));

	if (hasBuilder && !hasOps) return 'builder';
	if (hasOps && !hasBuilder) return 'ops';
	if (hasLeader && !hasBuilder && !hasOps) return 'leader';
	if (hasBuilder) return 'builder';
	if (hasOps) return 'ops';
	return 'leader';
}

function getRoleKeywords(roleFamily: 'leader' | 'ops' | 'builder', jobDescription: string): string[] {
	const lower = jobDescription.toLowerCase();
	const common = [];

	if (lower.includes('ai')) common.push('ai');
	if (lower.includes('developer')) common.push('developer');
	if (lower.includes('workflow')) common.push('workflow');
	if (lower.includes('typescript')) common.push('typescript');
	if (lower.includes('node')) common.push('node');
	if (lower.includes('react')) common.push('react');
	if (lower.includes('kubernetes')) common.push('kubernetes');
	if (lower.includes('aws')) common.push('aws');
	if (lower.includes('terraform')) common.push('terraform');
	if (lower.includes('product-minded') || lower.includes('product engineering')) common.push('product');

	const roleKeywords = {
		leader: ['architecture', 'enterprise', 'leadership', 'strategy', 'transformation'],
		ops: ['platform', 'cloud', 'kubernetes', 'terraform', 'migration', 'ci/cd'],
		builder: ['typescript', 'node', 'developer', 'workflow', 'product', 'ai']
	}[roleFamily];

	return unique([...roleKeywords, ...common]);
}

function buildFallbackFitAnalysis(
	contentTools: ContentTools,
	jobDescription: string,
	variantHint: 'leader' | 'ops' | 'builder'
): Record<string, unknown> {
	const roleFamily = detectRoleFamily(jobDescription);
	const keywords = getRoleKeywords(roleFamily, jobDescription);
	const skillResults = contentTools.searchSkills(keywords).slice(0, 6);
	const experienceResults = contentTools.searchExperience(keywords).slice(0, 4);

	const matchingSkills = skillResults.map((skill) => ({
		name: skill.name,
		context: skill.category
	}));

	const matchingExperience = experienceResults.map((exp) => ({
		role: exp.role,
		company: exp.company,
		dateRange: exp.dateRange,
		relevance: exp.highlights[0] || exp.description
	}));

	const gaps: string[] = [];
	const lower = jobDescription.toLowerCase();

	if (lower.includes('react')) {
		gaps.push('React-specific depth is not strongly evidenced in the current background data.');
	}
	if (lower.includes('healthcare') || lower.includes('clinical')) {
		gaps.push('Direct healthcare or clinical domain experience is not evident.');
	}
	if (lower.includes('phd') || lower.includes('research scientist')) {
		gaps.push('Research-oriented academic credentials are not evident.');
	}
	if (lower.includes('terraform') && !keywords.includes('terraform')) {
		gaps.push('Terraform-specific evidence is limited in the available background data.');
	}

	if (matchingExperience.length === 0) {
		gaps.push('The strongest matching experience is limited for this role based on the current evidence.');
	}

	const resumeVariantRecommendation =
		roleFamily === 'builder' || roleFamily === 'ops' || roleFamily === 'leader'
			? roleFamily
			: variantHint;

	const fitScore = Math.max(
		15,
		Math.min(
			85,
			30 + matchingSkills.length * 6 + matchingExperience.length * 8 - gaps.length * 8
		)
	);

	const fitLevel = fitScore >= 80 ? 'good' : fitScore >= 50 ? 'maybe' : 'not';
	const confidence = matchingExperience.length >= 2 ? 'medium' : 'low';

	const analysis = [
		`Brian looks like a ${fitLevel === 'good' ? 'strong' : fitLevel === 'maybe' ? 'partial' : 'limited'} fit for this role based on the currently available evidence. The strongest overlap is in ${roleFamily === 'builder' ? 'application engineering, TypeScript-adjacent delivery, and AI-enabled developer workflow work' : roleFamily === 'ops' ? 'platform engineering, cloud modernization, and delivery systems' : 'architecture, enterprise modernization, and technical leadership'}.`,
		`The clearest supporting evidence comes from ${matchingExperience.length > 0 ? `${matchingExperience[0].role} at ${matchingExperience[0].company}` : 'Brian’s broader resume summary'}, while the biggest gaps are ${gaps.length > 0 ? gaps.slice(0, 2).join(' ') : 'relatively minor based on the current requirements'}. Keep the recommendation measured rather than promotional.`
	].join('\n\n');

	return {
		fitScore,
		fitLevel,
		confidence,
		matchingSkills,
		matchingExperience,
		gaps,
		analysis,
		resumeVariantRecommendation,
		cta: {
			text: 'Connect with Brian',
			link: '/contact/'
		}
	};
}

function normalizeFitAnalysis(
	jobDescription: string,
	analysis: Record<string, unknown>
): Record<string, unknown> {
	const lower = jobDescription.toLowerCase();
	const normalized = { ...analysis };
	const rawScore = typeof normalized.fitScore === 'number' ? normalized.fitScore : Number(normalized.fitScore || 0);
	let fitScore = Number.isFinite(rawScore) ? rawScore : 0;
	let fitLevel = typeof normalized.fitLevel === 'string' ? normalized.fitLevel : 'maybe';
	const gaps = Array.isArray(normalized.gaps)
		? normalized.gaps.map((gap) => String(gap))
		: [];

	const ensureGap = (text: string) => {
		if (!gaps.some((gap) => gap.toLowerCase().includes(text.toLowerCase()))) {
			gaps.push(text);
		}
	};

	if (lower.includes('healthcare') || lower.includes('clinical')) {
		ensureGap('Healthcare or clinical workflow domain expertise');
	}

	if (lower.includes('model evaluation') || lower.includes('prompt testing')) {
		ensureGap('Experience with model evaluation and prompt testing');
	}

	const isResearchHeavy =
		lower.includes('research scientist') ||
		lower.includes('top-tier conferences') ||
		lower.includes('frontier models') ||
		lower.includes('phd in');

	if (isResearchHeavy) {
		ensureGap('PhD in machine learning, NLP, or related field');
		ensureGap('Published research in top-tier conferences');
		ensureGap('Experience training or fine-tuning frontier models');
		fitScore = Math.min(fitScore, 45);
		fitLevel = fitScore >= 50 ? 'maybe' : 'not';
	}

	const isPlatformHeavy =
		lower.includes('platform engineer') ||
		lower.includes('platform engineering') ||
		lower.includes('terraform') ||
		lower.includes('kubernetes') ||
		lower.includes('regulated');

	if (isPlatformHeavy && lower.includes('5+ years aws')) {
		const hasStrongAwsGap = gaps.some((gap) => /aws/i.test(gap));
		if (!hasStrongAwsGap && fitScore > 79) {
			ensureGap('Depth against the explicit 5+ years of AWS experience requirement is not fully evidenced.');
			fitScore = Math.min(fitScore, 78);
			fitLevel = 'maybe';
		}
	}

	normalized.fitScore = Math.max(0, Math.min(100, Math.round(fitScore)));
	normalized.fitLevel = fitLevel;
	normalized.gaps = gaps;

	return normalized;
}

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
						temperature: 0.2,
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
						const toolResult = executeToolCall(contentTools, fc.name!, fc.args || {});
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
- If the job description mentions healthcare or clinical work, at least one gap must explicitly say "healthcare" or "clinical"
- If the job description mentions model evaluation or prompt testing, include that exact gap explicitly when it is not strongly evidenced
- For platform, cloud, SRE, DevOps, or infrastructure roles, compare the response directly to the stated requirements instead of giving a broad positive summary
- If AWS depth is weaker than other requirements, say that explicitly rather than implying it is fully covered
- Avoid phrases like "strong fit" unless the evidence clearly covers the major requirements named in the job description
- For research-scientist or PhD-heavy roles, default to "not" or a low-end "maybe" unless there is direct evidence of academic research, publications, or frontier-model training
- If the job description asks for a PhD, top-tier publications, or frontier-model training and those are not evidenced, keep fitScore below 50
- fitScore should be conservative when critical requirements are missing
- confidence should reflect evidence quality, not optimism
- cta should be useful but understated
- Avoid generic openings like "demonstrates strong capabilities" or "has a passion for"
- Name the strongest evidence concretely using actual roles, projects, or tool-derived skills
- If the role is only a partial match, say that plainly in the first sentence
- Keep the narrative to 120-170 words total unless the role is unusually complex

RESUME RECOMMENDATION:
- Choose "leader" for architecture, strategy, transformation, multi-team leadership, and enterprise modernization roles
- Choose "ops" for platform engineering, DevOps, SRE, cloud infrastructure, CI/CD, migrations, and operational excellence roles
- Choose "builder" for full-stack engineering, TypeScript/JavaScript product development, developer tooling, application engineering, and AI-powered developer workflow roles
- Do NOT choose "builder" solely because the role includes the word "product"; product management roles are usually better aligned to "leader" unless the evidence clearly points to hands-on application engineering
- Treat the incoming variant "${variant}" as a soft hint only when the evidence is otherwise a close call
- The recommendation must follow the role evidence, not the hint, when the fit is clearly stronger elsewhere

BUILDER ROLE GUIDANCE:
- If the role emphasizes TypeScript, Node.js, full-stack delivery, product-minded engineering, internal tools, or AI-powered developer workflows, actively look for builder-relevant evidence
- In those cases, prefer citing application delivery, developer productivity work, and AI workflow implementation over broad platform modernization language

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
						temperature: 0.1,
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
				const submitCall = functionCalls.find(fc => fc.name && isSubmitAnalysisCall(fc.name));
				if (submitCall) {
					analysis = submitCall.args || null;
					break;
				}

				// Execute all other function calls
				const functionResponses = functionCalls.map(fc => {
					const toolResult = executeToolCall(contentTools, fc.name!, fc.args || {});
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

				analysis = normalizeFitAnalysis(jobDescription, analysis);

				res.set(corsHeaders);
				res.status(200).json({
					analysis
				});

		} catch (error) {
			console.error('Fit finder error:', error);
			try {
				const { jobDescription, variant = 'leader' }: FitFinderRequest = req.body;
				const contentIndex = await fetchContentIndex();
				if (contentIndex && jobDescription) {
					const fallbackAnalysis = buildFallbackFitAnalysis(
						new ContentTools(contentIndex),
						jobDescription,
						variant
					);
					const normalizedFallback = normalizeFitAnalysis(jobDescription, fallbackAnalysis);
					res.set(corsHeaders);
					res.status(200).json({
						analysis: normalizedFallback,
						fallback: true
					});
					return;
				}
			} catch (fallbackError) {
				console.error('Fit finder fallback error:', fallbackError);
			}
			res.status(500).json({ error: 'Internal server error' });
		}
	}
);
