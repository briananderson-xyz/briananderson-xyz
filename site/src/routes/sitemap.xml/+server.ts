import { PUBLIC_SITE_URL } from '$env/static/public';
import type { ContentMetadata } from '$lib/types';

export const prerender = true;
const site = PUBLIC_SITE_URL;
export const GET = async () => {
  const buildDate = new Date().toISOString().split('T')[0];
  const staticPages = ['/', '/blog', '/projects', '/interests', '/following', '/resume', '/ops', '/builder', '/ops/resume', '/builder/resume'];
  const aiPages = ['/llms.txt', '/resume.json'];
  const mBlog = import.meta.glob('/content/blog/**/*.md', { eager: true });
  const mProj = import.meta.glob('/content/projects/**/*.md', { eager: true });

  const contentEntries = (mod: Record<string, unknown>) =>
    Object.entries(mod).map(([p, mdl]) => {
      const m = mdl as { metadata: ContentMetadata };
      return {
        path: p.replace('/content', '').replace('.md', ''),
        lastmod: m.metadata?.date ? new Date(m.metadata.date).toISOString().split('T')[0] : buildDate
      };
    });

  const staticEntries = [...staticPages, ...aiPages].map((p) => ({ path: p, lastmod: buildDate }));
  const posts = contentEntries(mBlog);
  const projs = contentEntries(mProj);

  const urls = [...staticEntries, ...posts, ...projs].map((e) => ({
    loc: aiPages.includes(e.path) ? `${site}${e.path}` : `${site}${e.path}${e.path === '/' ? '' : '/'}`,
    lastmod: e.lastmod
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('')}
  </urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
