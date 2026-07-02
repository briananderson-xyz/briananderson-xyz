/**
 * node:test coverage for site/functions/src/security.ts.
 * Run via `pnpm test` (builds with tsc, then `node --test` against the
 * compiled lib/ output — see package.json).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	ALLOWED_ORIGINS,
	PRIMARY_ORIGIN,
	corsHeadersFor,
	corsHeaders,
	isAllowedCtaLink,
	validateHistory,
	MAX_HISTORY,
	MAX_HISTORY_CONTENT_BYTES,
	ALLOWED_VARIANTS,
	isValidVariant
} from './security.js';

describe('isAllowedCtaLink — AC-11 bypass vectors', () => {
	const vectors: Array<[string, boolean]> = [
		['/\\evil.com', false],
		['/\\/evil.com', false],
		['/..//evil.com', true],
		[' javascript:alert(1)', false],
		['https:/\\evil.com', false],
		['/contact/', true],
		['https://x.com', true],
		['MAILTO:A@B.com', true]
	];

	for (const [input, expected] of vectors) {
		test(`isAllowedCtaLink(${JSON.stringify(input)}) === ${expected}`, () => {
			assert.equal(isAllowedCtaLink(input), expected);
		});
	}

	test('rejects the raw open-redirect bypass primitive', () => {
		// Confirms the underlying browser/URL-normalization trick is real...
		assert.equal(new URL('/\\evil.com', 'https://briananderson.xyz').href, 'https://evil.com/');
		// ...and that isAllowedCtaLink is not fooled by it.
		assert.equal(isAllowedCtaLink('/\\evil.com'), false);
	});

	test('rejects protocol-relative //', () => {
		assert.equal(isAllowedCtaLink('//evil.com'), false);
	});

	test('rejects javascript:/data:/http:/vbscript: schemes', () => {
		assert.equal(isAllowedCtaLink('javascript:alert(1)'), false);
		assert.equal(isAllowedCtaLink('data:text/html,x'), false);
		assert.equal(isAllowedCtaLink('http://x.com'), false);
		assert.equal(isAllowedCtaLink('vbscript:msgbox(1)'), false);
	});

	test('rejects non-string / empty input', () => {
		// @ts-expect-error - intentionally testing runtime guard against bad input
		assert.equal(isAllowedCtaLink(undefined), false);
		assert.equal(isAllowedCtaLink(''), false);
	});

	test('accepts mailto: case-insensitively', () => {
		assert.equal(isAllowedCtaLink('mailto:a@b.com'), true);
	});
});

describe('validateHistory', () => {
	test('accepts a valid history array', () => {
		const result = validateHistory([
			{ role: 'user', content: 'hi' },
			{ role: 'assistant', content: 'hello' },
			{ role: 'model', content: 'hi there' }
		]);
		assert.deepEqual(result, { ok: true });
	});

	test('accepts an empty array', () => {
		assert.deepEqual(validateHistory([]), { ok: true });
	});

	test('rejects a non-array', () => {
		const result = validateHistory('not-an-array');
		assert.equal(result.ok, false);
		assert.equal(result.error, 'History must be an array');
	});

	test(`rejects more than ${MAX_HISTORY} entries`, () => {
		const history = Array.from({ length: MAX_HISTORY + 1 }, () => ({ role: 'user', content: 'x' }));
		const result = validateHistory(history);
		assert.equal(result.ok, false);
		assert.match(result.error ?? '', new RegExp(`${MAX_HISTORY} entries`));
	});

	test('accepts exactly the max entry count', () => {
		const history = Array.from({ length: MAX_HISTORY }, () => ({ role: 'user', content: 'x' }));
		assert.equal(validateHistory(history).ok, true);
	});

	test('rejects an invalid role, including client-local "system"', () => {
		const result = validateHistory([{ role: 'system', content: 'Sorry, an error occurred.' }]);
		assert.equal(result.ok, false);
		assert.equal(result.error, 'Invalid history entry role');
	});

	test('rejects a non-string content field', () => {
		const result = validateHistory([{ role: 'user', content: 42 }]);
		assert.equal(result.ok, false);
		assert.equal(result.error, 'Invalid history entry content');
	});

	test('rejects oversized entry content', () => {
		const oversized = 'a'.repeat(MAX_HISTORY_CONTENT_BYTES + 1);
		const result = validateHistory([{ role: 'user', content: oversized }]);
		assert.equal(result.ok, false);
		assert.match(result.error ?? '', /must not exceed/);
	});

	test('accepts content at exactly the byte cap', () => {
		const atCap = 'a'.repeat(MAX_HISTORY_CONTENT_BYTES);
		assert.equal(validateHistory([{ role: 'user', content: atCap }]).ok, true);
	});

	test('rejects a non-object entry', () => {
		assert.equal(validateHistory([null]).ok, false);
		assert.equal(validateHistory(['a string entry']).ok, false);
	});
});

describe('corsHeadersFor', () => {
	test('echoes an allowlisted Origin', () => {
		for (const origin of ALLOWED_ORIGINS) {
			const headers = corsHeadersFor({ headers: { origin } });
			assert.equal(headers['Access-Control-Allow-Origin'], origin);
		}
	});

	test('falls back to the primary origin for a non-allowlisted Origin', () => {
		const headers = corsHeadersFor({ headers: { origin: 'https://evil.com' } });
		assert.equal(headers['Access-Control-Allow-Origin'], PRIMARY_ORIGIN);
	});

	test('falls back to the primary origin when Origin is missing', () => {
		const headers = corsHeadersFor({ headers: {} });
		assert.equal(headers['Access-Control-Allow-Origin'], PRIMARY_ORIGIN);
	});

	test('falls back to the primary origin when Origin is an array (malformed request)', () => {
		const headers = corsHeadersFor({ headers: { origin: ['https://briananderson.xyz', 'https://evil.com'] } });
		assert.equal(headers['Access-Control-Allow-Origin'], PRIMARY_ORIGIN);
	});

	test('always sets Vary: Origin', () => {
		assert.equal(corsHeadersFor({ headers: {} })['Vary'], 'Origin');
		assert.equal(corsHeadersFor({ headers: { origin: PRIMARY_ORIGIN } })['Vary'], 'Origin');
	});

	test('sets Methods/Headers', () => {
		const headers = corsHeadersFor({ headers: {} });
		assert.equal(headers['Access-Control-Allow-Methods'], 'GET, POST, OPTIONS');
		assert.equal(headers['Access-Control-Allow-Headers'], 'Content-Type');
	});

	test('backward-compatible static corsHeaders export defaults to the primary origin', () => {
		assert.equal(corsHeaders['Access-Control-Allow-Origin'], PRIMARY_ORIGIN);
	});
});

describe('isValidVariant — AC-16', () => {
	test('accepts every value in ALLOWED_VARIANTS', () => {
		for (const variant of ALLOWED_VARIANTS) {
			assert.equal(isValidVariant(variant), true);
		}
	});

	test('rejects an unknown variant string', () => {
		assert.equal(isValidVariant('default'), false);
		assert.equal(isValidVariant('admin'), false);
	});

	test('rejects non-string / undefined variant', () => {
		assert.equal(isValidVariant(undefined), false);
		assert.equal(isValidVariant(42), false);
		assert.equal(isValidVariant(null), false);
	});

	test('is case-sensitive (does not silently normalize)', () => {
		assert.equal(isValidVariant('Leader'), false);
	});
});
