import { render } from 'svelte/server';

export const prerender = true;

export const load = async ({ params }) => {
    // Use relative path to ensure correct resolution
    const modules = import.meta.glob('../../../../content/blog/**/*.md');
    const match = Object.keys(modules).find((p) => p.endsWith(`/${params.slug}.md`));

    if (!match) {
        return { html: null, metadata: null };
    }

    const mod = await modules[match]() as { default: any; metadata: any };
    const { html } = render(mod.default, { props: { metadata: mod.metadata } });

    return { html, metadata: mod.metadata };
};
