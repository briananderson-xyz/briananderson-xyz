import { PUBLIC_SITE_URL } from "$env/static/public";
import type { ContentMetadata } from "$lib/types";
import { parseContentMetadata } from "$lib/schemas/content";

export const prerender = true;
const site = PUBLIC_SITE_URL;
export const GET = async () => {
  const staticPages = [
    "/",
    "/blog",
    "/projects",
    "/interests",
    "/now",
    "/following",
    "/proof",
    "/trace-one-answer",
    "/resume",
    "/ops",
    "/builder",
    "/ops/resume",
    "/builder/resume"
  ];
  const aiPages = ["/llms.txt", "/resume.json"];
  const mBlog = import.meta.glob("/content/blog/**/*.md", { eager: true });
  const mProj = import.meta.glob("/content/projects/**/*.md", { eager: true });

  const contentEntries = (mod: Record<string, unknown>) =>
    Object.entries(mod)
      .map(([p, mdl]) => {
        const m = mdl as { metadata: ContentMetadata };
        const metadata = parseContentMetadata(m.metadata, p);
        return {
          path: p.replace("/content", "").replace(".md", ""),
          lastmod: metadata.updated ?? metadata.date
        };
      })
      .sort((first, second) => first.path.localeCompare(second.path));

  const staticEntries = [...staticPages, ...aiPages].map((p) => ({ path: p }));
  const posts = contentEntries(mBlog);
  const projs = contentEntries(mProj);

  const urls = [...staticEntries, ...posts, ...projs].map((e) => ({
    loc: aiPages.includes(e.path)
      ? `${site}${e.path}`
      : `${site}${e.path}${e.path === "/" ? "" : "/"}`,
    lastmod: "lastmod" in e ? e.lastmod : undefined
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map((u) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("")}
  </urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
