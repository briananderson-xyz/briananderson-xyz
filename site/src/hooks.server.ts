import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // AI Content Signals / AI Preferences headers
  response.headers.set('AI-Preferences', 'index, archive, summarize, train');
  response.headers.set('X-AI-Crawler', 'allow');
  response.headers.set('X-AI-Training', 'allow');
  response.headers.set('X-AI-Citation', 'required');

  return response;
};
