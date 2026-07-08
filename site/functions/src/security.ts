/**
 * Security-related pure helpers shared by the Express server (`server.ts`)
 * and the request handlers (`handlers.ts`): CORS allowlist headers, CTA link
 * scheme/origin whitelisting, chat history validation, input size caps, and
 * fit-finder `variant` validation. Kept dependency-free and side-effect-free
 * (module load time excepted) so it can be unit tested directly with
 * `node:test` — see `security.test.ts`.
 */
import { timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// Cloudflare Worker → Cloud Run origin verification
// ---------------------------------------------------------------------------

export const ORIGIN_VERIFY_HEADER = 'x-origin-verify';

type OriginVerificationResult =
	| { ok: true }
	| { ok: false; reason: 'missing_token' | 'missing_header' | 'invalid_header' };

function originVerifyToken(): string | undefined {
	const token = process.env.ORIGIN_VERIFY_TOKEN;
	return typeof token === 'string' && token.length > 0 ? token : undefined;
}

/**
 * Require the shared Worker→origin token in production, and whenever a token is
 * configured locally. This keeps local tests/dev open by default, but production
 * fails closed if the secret was accidentally omitted from Cloud Run.
 */
export function originVerificationRequired(): boolean {
	return process.env.NODE_ENV === 'production' || originVerifyToken() !== undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function verifyOriginHeader(req: any): OriginVerificationResult {
	if (!originVerificationRequired()) {
		return { ok: true };
	}

	const expected = originVerifyToken();
	if (!expected) {
		return { ok: false, reason: 'missing_token' };
	}

	const actual = req?.headers?.[ORIGIN_VERIFY_HEADER];
	if (typeof actual !== 'string') {
		return { ok: false, reason: 'missing_header' };
	}

	const expectedBuffer = Buffer.from(expected);
	const actualBuffer = Buffer.from(actual);
	if (actualBuffer.length !== expectedBuffer.length) {
		return { ok: false, reason: 'invalid_header' };
	}

	return timingSafeEqual(actualBuffer, expectedBuffer)
		? { ok: true }
		: { ok: false, reason: 'invalid_header' };
}

// ---------------------------------------------------------------------------
// CORS allowlist
// ---------------------------------------------------------------------------

export const ALLOWED_ORIGINS = [
	'https://briananderson.xyz',
	'https://www.briananderson.xyz',
	'http://localhost:5173'
];
export const PRIMARY_ORIGIN = 'https://briananderson.xyz';

/**
 * Origin-aware CORS headers: echoes the request Origin when it is on the
 * allowlist, otherwise falls back to the primary origin. Always varies on
 * Origin so caches don't leak one origin's headers to another.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function corsHeadersFor(req: any): Record<string, string> {
	const requestOrigin = req?.headers?.origin;
	const allowOrigin =
		typeof requestOrigin === 'string' && ALLOWED_ORIGINS.includes(requestOrigin)
			? requestOrigin
			: PRIMARY_ORIGIN;

	return {
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Vary': 'Origin',
	};
}

// Backward-compatible static export (primary-origin headers) for any external importer
export const corsHeaders = corsHeadersFor({ headers: {} });

// ---------------------------------------------------------------------------
// CTA link whitelist
// ---------------------------------------------------------------------------

/**
 * Whitelists CTA link schemes/targets before a model-controlled link reaches
 * the client. Rejects:
 *  - any embedded backslash (spec-compliant URL parsers — and browsers —
 *    normalize `\` to `/` for special schemes, which is how a "relative"
 *    link like `/\evil.com` actually resolves to `https://evil.com/`)
 *  - ASCII control characters, or leading/trailing whitespace (e.g. a
 *    leading space before `javascript:` that some parsers tolerate)
 *  - protocol-relative `//` links
 * Relative paths (starting with a single `/`) must resolve, against
 * PRIMARY_ORIGIN, to that same origin. Absolute URLs must use the `https:`
 * or `mailto:` scheme (case-insensitive; `new URL().protocol` is always
 * lowercased). Any parse failure is treated as not-allowed. Pure function —
 * safe to unit test directly.
 */
export function isAllowedCtaLink(link: string): boolean {
	if (typeof link !== 'string' || link.length === 0) {
		return false;
	}

	if (link.includes('\\')) {
		return false;
	}

	// eslint-disable-next-line no-control-regex
	if (/[\x00-\x1f\x7f]/.test(link) || link.trim() !== link) {
		return false;
	}

	if (link.startsWith('/')) {
		if (link.startsWith('//')) {
			return false;
		}

		try {
			return new URL(link, PRIMARY_ORIGIN).origin === PRIMARY_ORIGIN;
		} catch {
			return false;
		}
	}

	try {
		const scheme = new URL(link).protocol.toLowerCase();
		return scheme === 'https:' || scheme === 'mailto:';
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// Input size caps + history validation
// ---------------------------------------------------------------------------

export const MAX_MESSAGE_BYTES = 2048;
export const MAX_JOBDESC_BYTES = 20480;
export const MAX_HISTORY = 10;
export const MAX_HISTORY_CONTENT_BYTES = 2048;

// NOTE: 'system' is intentionally excluded — it is client-local UI state
// (error/notice messages), never a genuine conversational turn, and is
// filtered out of the outbound history payload by Chatbot.svelte before it
// ever reaches this validator (see history construction there).
export const HISTORY_ROLES = new Set(['user', 'model', 'assistant']);

/**
 * Validates a chat history payload: array shape, entry count, and per-entry
 * role/content size. Pure function — safe to unit test directly.
 *
 * Residual risk (accepted this wave, see session notes): history entries are
 * entirely client-supplied with no server-side session binding, so a
 * `role: 'model'` entry only proves shape/size validity, not that the
 * assistant actually said it. Guardrails run per-entry (handlers.ts), which
 * also does not catch a trigger phrase split across multiple entries. Both
 * are out of scope for this wave.
 */
export function validateHistory(history: unknown): { ok: boolean; error?: string } {
	if (!Array.isArray(history)) {
		return { ok: false, error: 'History must be an array' };
	}

	if (history.length > MAX_HISTORY) {
		return { ok: false, error: `History must not exceed ${MAX_HISTORY} entries` };
	}

	for (const entry of history) {
		if (!entry || typeof entry !== 'object') {
			return { ok: false, error: 'Invalid history entry' };
		}

		const { role, content } = entry as { role?: unknown; content?: unknown };

		if (typeof role !== 'string' || !HISTORY_ROLES.has(role)) {
			return { ok: false, error: 'Invalid history entry role' };
		}

		if (typeof content !== 'string') {
			return { ok: false, error: 'Invalid history entry content' };
		}

		if (Buffer.byteLength(content, 'utf8') > MAX_HISTORY_CONTENT_BYTES) {
			return { ok: false, error: `History entry content must not exceed ${MAX_HISTORY_CONTENT_BYTES} bytes` };
		}
	}

	return { ok: true };
}

// ---------------------------------------------------------------------------
// Fit-finder / chat `variant` validation
// ---------------------------------------------------------------------------

// Verified against actual usage: handlers.ts `detectRoleFamily`/
// `buildFallbackFitAnalysis`/the fit-finder prompt all operate on exactly
// this 3-value set (types.ts `FitFinderRequest['variant']` /
// `ChatRequest['variant']`). There is no 'default' variant in this codebase.
export const ALLOWED_VARIANTS = ['leader', 'ops', 'builder'] as const;
export type Variant = (typeof ALLOWED_VARIANTS)[number];

/**
 * Runtime validation for the `variant` field — the TypeScript request types
 * are compile-time only and do not constrain the actual JSON body. Never
 * interpolate an unvalidated `variant` value into a model prompt.
 */
export function isValidVariant(variant: unknown): variant is Variant {
	return typeof variant === 'string' && (ALLOWED_VARIANTS as readonly string[]).includes(variant);
}

/**
 * Kill switch. When AI_ENABLED is explicitly "false" (set manually via
 * `gcloud run services update ... --update-env-vars AI_ENABLED=false`, or by
 * the budget-breach automation), the AI handlers short-circuit with a
 * structured 503 {code:"ai_disabled"} and make no Gemini call. Defaults to
 * enabled so a missing/typo'd value never dark-ships the API.
 */
export function aiEnabled(): boolean {
	return process.env.AI_ENABLED !== 'false';
}
