import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();

		// For development, use mock responses
		// In production, this would call Firebase Functions
		const isDev = false; // Disabled to test real API

		if (isDev) {
			// Mock response for development
			const mockResponse = `Thanks for your question! I'm Brian's AI assistant.

I can help you learn about:
- My professional experience and technical skills
- Projects I've worked on  
- My approach to leadership and engineering
- Which resume variant might be best for your needs

What would you like to know?`;

			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 500));

			return json({
				response: mockResponse,
				mock: true
			});
		}

		// In production, call Firebase Function
		const functionUrl = `https://chat-jefw7grwra-uc.a.run.app`;
		
		const response = await fetch(functionUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			throw new Error('Function call failed');
		}

		const data = await response.json();
		return json(data);

	} catch (error) {
		console.error('Chat API error:', error);
		return json(
			{ error: 'Failed to process chat request' },
			{ status: 500 }
		);
	}
};
