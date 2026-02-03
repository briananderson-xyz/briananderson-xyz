import { PUBLIC_SITE_URL } from '$env/static/public';

export const prerender = true;
const site = PUBLIC_SITE_URL;
export const GET = async () => {
  const staticPages = ['/', '/blog', '/projects', '/resume', '/ops', '/builder', '/ops/resume', '/builder/resume'];
  const aiPages = ['/llms.txt', '/resume.json'];
  const mBlog = import.meta.glob('/content/blog/**/*.md', { eager: true });
  const mProj = import.meta.glob('/content/projects/**/*.md', { eager: true });
  const posts = Object.keys(mBlog).map((p) => p.replace('/content', '').replace('.md', ''));
  const projs = Object.keys(mProj).map((p) => p.replace('/content', '').replace('.md', ''));
  const urls = [...staticPages, ...aiPages, ...posts, ...projs].map((p) =>
    aiPages.includes(p) ? `${site}${p}` : `${site}${p}${p === '/' ? '' : '/'}`
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `<url><loc>${u}</loc></url>`).join('')}
  </urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
