import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './systemPrompt.js';
import { checkGuardrails, getRefusalMessage } from './guardrails.js';

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

			// Use Gemini API if key is available
			console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
			console.log('GEMINI_API_KEY length:', GEMINI_API_KEY?.length);
			
			if (GEMINI_API_KEY) {
				try {
					const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
					const model = genAI.getGenerativeModel({
						model: 'gemini-2.5-flash',
						systemInstruction: getSystemPrompt(SITE_URL),
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
					const result = await chat.sendMessage(message);
					const response = result.response.text();

					res.set(corsHeaders);
					res.status(200).json({
						response,
						mock: false
					});
					return;
				} catch (error) {
					console.error('Gemini API error:', error);
					// Fall through to mock response
				}
			}

			// Mock response for development or if AI fails
			const mockResponse = `Thanks for your question! I'm Brian's AI assistant.

I can help you learn about:
- My professional experience and technical skills
- Projects I've worked on
- My approach to leadership and engineering
- Which resume variant might be best for your needs

What would you like to know?`;

			res.set(corsHeaders);
			res.status(200).json({
				response: mockResponse,
				mock: true
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

			// Use Gemini API for Fit Finder if key is available
			if (GEMINI_API_KEY) {
				try {
					const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
					const model = genAI.getGenerativeModel({
						model: 'gemini-2.5-flash',
						generationConfig: {
							maxOutputTokens: 2000,
							temperature: 0.5,
						},
					});

					const prompt = `You are analyzing a job description to determine if Brian Anderson is a good fit.

Context about Brian:
- Technical Director & Enterprise Solutions Architect based in Denver, CO
- 10+ years experience with AWS, Kubernetes, DevOps, cloud-native platforms
- Led engineering teams of 5-15 engineers at enterprise scale
- Specializes in cloud-native transformation, GenAI integration, platform engineering
- Full professional details available at: ${SITE_URL}/llms.txt
- Resume available at: ${SITE_URL}/resume
- Projects available at: ${SITE_URL}/projects
- Blog posts available at: ${SITE_URL}/blog

Job Description:
${jobDescription}

CRITICAL REQUIREMENTS:
1. Every skill and experience claim MUST be verifiable from Brian's actual background
2. Include URLs for all claims - use ${SITE_URL}/projects/[slug] for project work, ${SITE_URL}/blog/[slug] for blog posts
3. Be humble and honest - acknowledge gaps rather than overselling
4. Focus on specific, concrete evidence over generic claims

Analyze the fit and respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "fitScore": <number 0-100>,
  "fitLevel": "<good|maybe|not>",
  "confidence": "<high|medium|low>",
  "matchingSkills": [
    {
      "name": "<specific skill name>",
      "url": "<${SITE_URL}/projects/project-slug or ${SITE_URL}/blog/post-slug where this skill is demonstrated>",
      "context": "<brief note: 'Used in GFS cloud migration' or 'Led Kubernetes adoption at Company X'>"
    }
  ],
  "matchingExperience": [
    {
      "role": "<exact role title>",
      "company": "<company name>",
      "dateRange": "<YYYY-YYYY>",
      "url": "<${SITE_URL}/projects/relevant-project if applicable>",
      "relevance": "<one sentence: why this experience is relevant to the job>"
    }
  ],
  "gaps": ["<specific skill or requirement from job that Brian lacks>"],
  "analysis": "<2-3 paragraph narrative explaining why Brian may or may not be a good fit. Be informative and humble. Explain the match between the role's needs and Brian's strengths. If there are gaps, acknowledge them honestly but don't dwell on shortcomings. End with a forward-looking statement about potential value Brian could bring.>",
  "resumeVariantRecommendation": "<leader|ops|builder>",
  "cta": {
    "text": "Connect with Brian",
    "link": "mailto:brian@briananderson.xyz"
  }
}

FIT LEVEL & SCORING GUIDELINES:
- fitLevel "good" (80-100 score): Strong alignment, core requirements match well
- fitLevel "maybe" (50-79 score): Partial alignment, some gaps but transferable skills
- fitLevel "not" (0-49 score): Significant misalignment or major gaps in critical areas

Confidence levels:
- high: Job requirements clearly align with Brian's documented work
- medium: Some alignment exists but details are limited
- low: Insufficient information to assess fit accurately`;

					const result = await model.generateContent(prompt);
					const response = result.response.text();

					// Parse JSON response
					const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
					const analysis = JSON.parse(jsonStr);

					res.set(corsHeaders);
					res.status(200).json({
						analysis,
						mock: false
					});
					return;
				} catch (error) {
					console.error('Gemini API error:', error);
					// Fall through to mock response
				}
			}

			// Mock response for development or if AI fails
			const mockAnalysis = {
				fitScore: 85,
				fitLevel: 'good' as const,
				confidence: 'high' as const,
				matchingSkills: [
					{
						name: 'AWS',
						url: `${SITE_URL}/projects/gfs-cloud-enablement`,
						context: 'Led cloud-native transformation at Gordon Food Service'
					},
					{
						name: 'Kubernetes',
						url: `${SITE_URL}/projects/gfs-cloud-enablement`,
						context: 'Architected enterprise Kubernetes platform'
					},
					{
						name: 'Team Leadership',
						context: 'Led engineering teams of 5-15 at Kin + Carta and GFS'
					}
				],
				matchingExperience: [
					{
						role: 'Senior Technical Principal',
						company: 'Kin + Carta',
						dateRange: '2021-2024',
						url: `${SITE_URL}/projects/gfs-cloud-enablement`,
						relevance: 'Led enterprise cloud transformation and platform engineering initiatives'
					}
				],
				gaps: ['Azure-specific experience', 'Deep Machine Learning expertise'],
				analysis: 'Based on the requirements, Brian appears to be a strong fit for this role. His extensive experience with AWS, Kubernetes, and cloud-native platforms aligns well with the core technical needs. His leadership background managing teams of 5-15 engineers demonstrates the people management skills required.\n\nWhile there are some gaps in Azure-specific experience and deep ML expertise, Brian\'s proven ability to learn new technologies quickly and his broad platform engineering background suggest these could be developed. His work on the GFS cloud transformation project shows he can lead large-scale initiatives successfully.\n\nBrian\'s combination of technical depth and leadership experience makes him well-suited to drive both technical excellence and team development in this role.',
				resumeVariantRecommendation: variant,
				cta: {
					text: 'Connect with Brian',
					link: 'mailto:brian@briananderson.xyz'
				}
			};

			res.set(corsHeaders);
			res.status(200).json({
				analysis: mockAnalysis,
				mock: true
			});

		} catch (error) {
			console.error('Fit finder error:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	}
);
