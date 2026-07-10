import { PUBLIC_SITE_URL } from "$env/static/public";
import type { ContentMetadata } from "$lib/types";
import { parseContentMetadata } from "$lib/schemas/content";

export const prerender = true;
const site = PUBLIC_SITE_URL;
export const GET = async () => {
  const modules = import.meta.glob("/content/blog/**/*.md", { eager: true });
  const items = Object.entries(modules)
    .map(([path, mod]) => {
      const m = mod as { metadata: ContentMetadata };
      const metadata = parseContentMetadata(m.metadata, path);
      return {
        title: metadata.title,
        date: new Date(`${metadata.updated ?? metadata.date}T00:00:00.000Z`).toUTCString(),
        url: site + path.replace("/content", "").replace(".md", "") + "/",
        summary: metadata.summary
      };
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Brian Anderson — Blog</title>
      <link>${site}</link>
      <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
      <description>Writing by Brian Anderson</description>
      <language>en-us</language>
      ${items
        .map(
          (i) => `
        <item>
          <title><![CDATA[${i.title}]]></title>
          <link>${i.url}</link>
          <pubDate>${i.date}</pubDate>
          <description><![CDATA[${i.summary}]]></description>
          <guid>${i.url}</guid>
        </item>`
        )
        .join("")}
    </channel>
  </rss>`;
  return new Response(feed, { headers: { "Content-Type": "application/xml" } });
};
