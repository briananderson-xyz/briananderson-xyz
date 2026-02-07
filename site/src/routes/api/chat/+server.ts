import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();

		// Use local emulator in dev, production URL otherwise
		const functionUrl = dev
			? 'http://127.0.0.1:5001/briananderson-xyz/us-central1/chat'
			: 'https://chat-jefw7grwra-uc.a.run.app';

		const response = await fetch(functionUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Firebase function error:', response.status, errorData);

			return json(
				{
					error: errorData.error || 'AI service error',
					details: errorData.details || 'Failed to process chat request',
					status: response.status
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);

	} catch (error) {
		console.error('Chat API error:', error);
		return json(
			{
				error: 'Service unavailable',
				details: error instanceof Error ? error.message : 'Failed to process chat request'
			},
			{ status: 500 }
		);
	}
};
