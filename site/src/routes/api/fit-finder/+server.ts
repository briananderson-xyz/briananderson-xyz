import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();

		// For development, use mock responses
		const isDev = false; // Disabled to test real API

		if (isDev) {
			// Mock response for development
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
				resumeVariantRecommendation: 'leader' as const,
				cta: {
					text: 'Connect with Brian',
					link: 'mailto:brian@briananderson.xyz'
				}
			};

			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 1000));

			return json({
				analysis: mockAnalysis,
				mock: true
			});
		}

		// In production, call Firebase Function
		const functionUrl = `https://fitfinder-jefw7grwra-uc.a.run.app`;
		
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
		console.error('Fit Finder API error:', error);
		return json(
			{ error: 'Failed to process fit finder request' },
			{ status: 500 }
		);
	}
};
