/**
 * Stable, CSS-ident-safe `view-transition-name` derived from a content title.
 *
 * Used for the shared-element morph between a list card title (/projects,
 * /blog) and the same title's `<h1>` on its detail page. Both sides only have
 * the title in common (the mdsvex PostLayout that renders the detail heading
 * has no access to the route/slug), so the title is the shared key.
 *
 * The `vt-title-` prefix guarantees the result starts with a letter, and all
 * non-alphanumerics collapse to hyphens, so the output is always a valid
 * <custom-ident>.
 */
export function titleTransitionName(title: string): string {
	const ident = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return `vt-title-${ident || 'untitled'}`;
}
