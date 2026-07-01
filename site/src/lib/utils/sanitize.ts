/**
 * Markdown sanitization utility for AI chat output
 * Renders markdown to HTML and strips dangerous content (scripts, event
 * handlers, javascript: URLs) before it is injected via {@html}
 */

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

marked.setOptions({
  breaks: true,
  gfm: true
});

/**
 * Convert raw markdown to sanitized, safe-to-render HTML
 * @param raw - Raw markdown string (e.g. assistant chat message content)
 * @returns Sanitized HTML string safe for use with {@html}
 */
export function sanitizeMarkdown(raw: string): string {
  if (typeof raw !== 'string' || raw.length === 0) return '';
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html);
}
