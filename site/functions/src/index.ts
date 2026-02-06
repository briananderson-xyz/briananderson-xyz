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
- Technical Director & Enterprise Solutions Architect
- 10+ years experience with AWS, Kubernetes, DevOps
- Led teams of 5-15 engineers
- Specializes in cloud-native transformation, GenAI integration, platform engineering
- Full details at: ${SITE_URL}/llms.txt

Job Description:
${jobDescription}

Analyze the fit and respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "fitScore": <number 0-100>,
  "confidence": "<high|medium|low>",
  "matchingSkills": [
    {"name": "<skill>", "metadata": "<years/context>"}
  ],
  "matchingExperience": [
    {
      "role": "<role title>",
      "company": "<company name>",
      "dateRange": "<YYYY-YYYY>",
      "relatedLinks": ["<url if relevant>"]
    }
  ],
  "gaps": ["<skill or experience gap>"],
  "recommendations": [
    "<specific recommendation about fit>",
    "<suggestion for positioning>"
  ],
  "resumeVariantRecommendation": "<leader|ops|builder>",
  "cta": {
    "text": "Connect with Brian",
    "link": "mailto:brian@briananderson.xyz"
  }
}

Be honest about gaps but focus on strengths. Fit score should be:
- 80-100: Excellent fit, strong alignment
- 60-79: Good fit, some gaps but manageable
- 40-59: Moderate fit, significant gaps
- 0-39: Poor fit, major misalignment

Confidence should reflect how well the JD matches Brian's documented experience.`;

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
				confidence: 'high' as const,
				matchingSkills: [
					{ name: 'AWS', metadata: '10+ years experience' },
					{ name: 'Kubernetes', metadata: 'Production deployments' },
					{ name: 'Team Leadership', metadata: 'Led teams of 5-15 engineers' }
				],
				matchingExperience: [
					{
						role: 'Senior Technical Principal',
						company: 'Kin + Carta',
						dateRange: '2021-2024',
						relatedLinks: ['/projects/gfs-cloud-enablement']
					}
				],
				gaps: ['Azure experience', 'Machine Learning'],
				recommendations: [
					'Strong fit for leadership-focused role',
					'Extensive cloud-native experience aligns well',
					'Consider highlighting DevOps transformation work'
				],
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
