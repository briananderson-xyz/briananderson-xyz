import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Raw markdown mirror of blog/[slug]. Sibling extension route, same pattern
// already used in this repo for resume/+page.svelte + resume.json/+server.ts.
const modules = import.meta.glob('/content/blog/**/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

function slugFromPath(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '');
}

export const prerender = true;

// Enumerate every blog slug so the prerenderer emits a .md URL per post
// (nothing links to these routes directly, so they'd otherwise be skipped).
export const entries = () => {
	return Object.keys(modules).map((path) => ({ slug: slugFromPath(path) }));
};

export const GET: RequestHandler = ({ params }) => {
	const match = Object.keys(modules).find((p) => p.endsWith(`/${params.slug}.md`));

	if (!match) {
		error(404, 'Not found');
	}

	return new Response(modules[match], {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8'
		}
	});
};
