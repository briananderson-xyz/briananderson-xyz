import { describe, it, expect } from 'vitest';
import {
	addVariant,
	removeVariant,
	getCanonicalVariantPath,
	getRedirectTarget,
	getCanonicalUrl
} from './variantLink';

describe('addVariant', () => {
	it('is a no-op for no variant or the default variant', () => {
		expect(addVariant('/resume', null)).toBe('/resume');
		expect(addVariant('/resume', undefined)).toBe('/resume');
		expect(addVariant('/resume', 'default')).toBe('/resume');
	});

	it('maps canonical home and resume paths to prefix form', () => {
		expect(addVariant('/', 'ops')).toBe('/ops/');
		expect(addVariant('/index.html', 'ops')).toBe('/ops/');
		expect(addVariant('/resume', 'ops')).toBe('/ops/resume/');
		expect(addVariant('/resume/', 'ops')).toBe('/ops/resume/');
	});

	it('rewrites homepage hash links to prefix form', () => {
		expect(addVariant('/#contact', 'ops')).toBe('/ops/#contact');
	});

	it('uses a query param for other paths and respects existing queries', () => {
		expect(addVariant('/blog/foo', 'ops')).toBe('/blog/foo?v=ops');
		expect(addVariant('/blog/foo?x=1', 'ops')).toBe('/blog/foo?x=1&v=ops');
	});

	it('does not double-append an existing variant query', () => {
		expect(addVariant('/blog/foo?v=ops', 'ops')).toBe('/blog/foo?v=ops');
	});
});

describe('removeVariant', () => {
	it('strips only the v query param, preserving others and the hash', () => {
		expect(removeVariant('/blog/foo?v=ops')).toBe('/blog/foo');
		expect(removeVariant('/blog/foo?x=1&v=ops')).toBe('/blog/foo?x=1');
		expect(removeVariant('/blog/foo#h')).toBe('/blog/foo#h');
	});
});

describe('getCanonicalVariantPath', () => {
	it('round-trips a prefixed path back to itself', () => {
		expect(getCanonicalVariantPath('/ops/resume/', 'ops')).toBe('/ops/resume/');
		expect(getCanonicalVariantPath('/ops', 'ops')).toBe('/ops/');
	});

	it('strips a static index.html artifact so links do not 404', () => {
		const out = getCanonicalVariantPath('/blog/index.html/', 'ops');
		expect(out).not.toContain('index.html');
		expect(out).toBe('/blog/?v=ops');
	});
});

describe('getRedirectTarget', () => {
	it('redirects generic canonical routes to the prefixed variant', () => {
		expect(getRedirectTarget('/', 'ops')).toBe('/ops/');
		expect(getRedirectTarget('/resume', 'ops')).toBe('/ops/resume/');
	});

	it('returns null for non-canonical routes or no variant', () => {
		expect(getRedirectTarget('/blog', 'ops')).toBeNull();
		expect(getRedirectTarget('/', null)).toBeNull();
		expect(getRedirectTarget('/', 'default')).toBeNull();
	});
});

describe('getCanonicalUrl', () => {
	it('prefixes the production origin', () => {
		expect(getCanonicalUrl('/resume/')).toBe('https://briananderson.xyz/resume/');
	});
});
