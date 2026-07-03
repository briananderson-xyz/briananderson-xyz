import { dev } from '$app/environment';

/**
 * Base URL for the Cloud Run chat / fit-finder API, resolved per environment:
 * the Vite dev proxy locally, the dev API host on the dev deployment, and the
 * production API host everywhere else.
 */
export function getApiBase(): string {
	if (dev) return '/api';
	if (typeof window !== 'undefined' && window.location.hostname === 'dev.briananderson.xyz') {
		return 'https://api-dev.briananderson.xyz';
	}
	return 'https://api.briananderson.xyz';
}
