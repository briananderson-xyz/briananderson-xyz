import type { ContentMetadata } from '$lib/types';

export const load = async () => {
    const modules = import.meta.glob('/content/projects/**/*.md', { eager: true });
    type Item = { metadata: ContentMetadata; route: string };
    const projects: Item[] = [];
    for (const [path, mod] of Object.entries(modules)) {
        // @ts-expect-error - dynamic import module type
        projects.push({ metadata: mod.metadata, route: path.replace('/content', '').replace('.md', '') });
    }
    projects.sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

    return { projects };
};
