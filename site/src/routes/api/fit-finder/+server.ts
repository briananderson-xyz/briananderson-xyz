import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();

		// In dev, proxy to the local API server (the Cloud Run Express app run
		// via `node lib/server.js`, or `pnpm test:ai:loop:local`) at :8080.
		// In production, the Cloudflare Worker fronts the deployed service.
		const localApiOrigin = process.env.LOCAL_API_ORIGIN || 'http://127.0.0.1:8080';
		const functionUrl = dev
			? `${localApiOrigin}/fit-finder`
			: 'https://api.briananderson.xyz/fit-finder';

		const response = await fetch(functionUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('API error:', response.status, errorData);

			return json(
				{
					error: errorData.error || 'AI service error',
					details: errorData.details || 'Failed to analyze job description',
					status: response.status
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);

	} catch (error) {
		console.error('Fit Finder API error:', error);
		return json(
			{
				error: 'Service unavailable',
				details: error instanceof Error ? error.message : 'Failed to process fit finder request'
			},
			{ status: 500 }
		);
	}
};
