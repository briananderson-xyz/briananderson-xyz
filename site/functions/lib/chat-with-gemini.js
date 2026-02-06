import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './systemPrompt.js';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://briananderson.xyz';
export async function chatWithGemini(message, history = []) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: getSystemPrompt(SITE_URL),
        generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
        },
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
        ],
    });
    // Convert history to Gemini format
    const chatHistory = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));
    // Start chat with history
    const chat = model.startChat({
        history: chatHistory,
    });
    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response.text();
    return response;
}
export async function analyzeFitWithGemini(jobDescription, variant = 'leader') {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.5, // Lower temperature for more consistent analysis
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
    try {
        // Remove markdown code blocks if present
        const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error('Failed to parse Gemini response:', response);
        throw new Error('Failed to parse fit analysis');
    }
}
//# sourceMappingURL=chat-with-gemini.js.map