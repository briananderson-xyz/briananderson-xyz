import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from './sanitize';

describe('sanitizeMarkdown', () => {
	it('returns empty string for empty or non-string input', () => {
		expect(sanitizeMarkdown('')).toBe('');
		expect(sanitizeMarkdown(null as unknown as string)).toBe('');
		expect(sanitizeMarkdown(undefined as unknown as string)).toBe('');
	});

	it('renders basic markdown to HTML', () => {
		expect(sanitizeMarkdown('**bold**')).toContain('<strong>bold</strong>');
		expect(sanitizeMarkdown('[link](https://example.com)')).toContain('href="https://example.com"');
	});

	it('strips script tags', () => {
		const out = sanitizeMarkdown('hello<script>alert(1)</script>');
		expect(out).not.toContain('<script');
		expect(out).toContain('hello');
	});

	it('removes javascript: URLs', () => {
		const out = sanitizeMarkdown('[x](javascript:alert(1))');
		expect(out).not.toContain('javascript:');
	});

	it('strips inline event handlers', () => {
		const out = sanitizeMarkdown('<img src=x onerror="alert(1)">');
		expect(out).not.toContain('onerror');
	});
});
