import { loadResume, buildResumeMarkdown } from '$lib/server/resumeMarkdown';

export const prerender = true;

export const GET = async () => {
	const resume = loadResume();
	const markdown = buildResumeMarkdown(resume);

	return new Response(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8'
		}
	});
};
