import { PUBLIC_SITE_URL } from '$env/static/public';

export const prerender = true;

export const GET = async () => {
  const robots = `# AI Content Signals Compliant
# See https://contentsignals.org/ for more information

# Allow all general crawlers
User-agent: *
Allow: /

# OpenAI GPTBot - AI crawling allowed
User-agent: GPTBot
Allow: /

# Google AI/LLM crawlers
User-agent: Google-Extended
Allow: /

# Common Crawl Bot
User-agent: CCBot
Allow: /

# Anthropic Claude
User-agent: ClaudeBot
Allow: /

# Perplexity AI
User-agent: PerplexityBot
Allow: /

# Cohere AI
User-agent: CohereBot
Allow: /

# Other AI crawlers
User-agent: *
Disallow: /api/
Disallow: /admin/

Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`;
  
  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};
