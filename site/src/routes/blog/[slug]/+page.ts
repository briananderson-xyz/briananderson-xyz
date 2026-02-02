export const prerender = true;
export const load = async ({ params, url }) => {
  let variant = null;
  try {
    variant = url.searchParams.get('v');
  } catch {
    // URL doesn't support searchParams during prerendering
  }
  const modules = import.meta.glob('/content/blog/**/*.md');
  const match = Object.keys(modules).find((p) => p.endsWith(`/${params.slug}.md`));
  if (!match) return { component: null, metadata: null, variant };
  const mod = await modules[match]() as { default: any; metadata: any };
  return { component: mod.default, metadata: mod.metadata, variant };
};
