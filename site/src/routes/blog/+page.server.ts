import type { ContentMetadata } from '$lib/types';

export const prerender = true;

export const load = async () => {
    const modules = import.meta.glob('../../../content/blog/**/*.md', { eager: true });
    console.log('Distilled debug: modules count:', Object.keys(modules).length);

    const posts = Object.entries(modules).map(([path, mod]) => {
        const m = mod as { metadata: ContentMetadata };
        return {
            metadata: m.metadata,
            route: path.replace('../../../content', '').replace('.md', '')
        };
    });

    posts.sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

    return { posts };
};
