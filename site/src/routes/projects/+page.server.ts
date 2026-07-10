import { parseContentMetadata } from "$lib/schemas/content";
import { projectSkills, projectVariants, type ProjectCatalogItem } from "$lib/utils/projectCatalog";

export const prerender = true;

export const load = async () => {
  const modules = import.meta.glob("/content/projects/**/*.md", { eager: true });
  const projects: ProjectCatalogItem[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const module = mod as { metadata: unknown };
    const metadata = parseContentMetadata(module.metadata, path);
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "");
    if (!slug) throw new Error(`Unable to derive project slug from ${path}`);
    projects.push({
      metadata,
      route: path.replace("/content", "").replace(".md", ""),
      slug,
      variants: projectVariants(metadata),
      skills: projectSkills(metadata)
    });
  }
  projects.sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

  return { projects };
};
