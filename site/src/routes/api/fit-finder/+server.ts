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
				fitLevel: 'good' as const,
				confidence: 'high' as const,
				matchingSkills: [
					{
						name: 'AWS',
						url: '/projects/gfs-cloud-enablement',
						context: 'Led cloud-native transformation at Gordon Food Service'
					},
					{
						name: 'Kubernetes',
						url: '/projects/gfs-cloud-enablement',
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
						url: '/projects/gfs-cloud-enablement',
						relevance: 'Led enterprise cloud transformation and platform engineering initiatives'
					}
				],
				gaps: ['Azure-specific experience', 'Deep Machine Learning expertise'],
				analysis: 'Based on the requirements, Brian appears to be a strong fit for this role. His extensive experience with AWS, Kubernetes, and cloud-native platforms aligns well with the core technical needs. His leadership background managing teams of 5-15 engineers demonstrates the people management skills required.\n\nWhile there are some gaps in Azure-specific experience and deep ML expertise, Brian\'s proven ability to learn new technologies quickly and his broad platform engineering background suggest these could be developed. His work on the GFS cloud transformation project shows he can lead large-scale initiatives successfully.\n\nBrian\'s combination of technical depth and leadership experience makes him well-suited to drive both technical excellence and team development in this role.',
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
