
export const load = async () => {
    const modules = import.meta.glob('/content/projects/**/*.md', { eager: true });
    type Item = { metadata: any; route: string };
    let projects: Item[] = [];
    for (const [path, mod] of Object.entries(modules)) {
        // @ts-ignore
        projects.push({ metadata: mod.metadata, route: path.replace('/content', '').replace('.md', '') });
    }
    projects.sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

    return { projects };
};
