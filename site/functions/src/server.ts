/**
 * Express server for Cloud Run deployment.
 * Entry point for both production (Dockerfile) and local dev (pnpm dev).
 *
 * Each Cloud Run service is dedicated to one function (chat or fit-finder).
 * The Cloudflare Worker routes /chat → chat service, /fit-finder → fitfinder service.
 * So each service handles POST at root (/).
 */
import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { handleChat } from './handlers.js';
import { handleFitFinder } from './handlers.js';
import { corsHeadersFor } from './security.js';
import { createMcpServer } from './mcp.js';

const asyncHandler = (fn: express.RequestHandler) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

const app = express();

// Cloud Run sits behind a single Cloudflare→Cloud Run proxy hop, so
// `trust proxy: 1` satisfies express-rate-limit's permissive-trust-proxy
// validation without trusting an arbitrary/spoofable forwarded chain. The
// rate limiter below keys on Cloudflare's `cf-connecting-ip` header (falling
// back to `req.ip`), so correct client identification does not actually
// depend on the exact hop count here — that's a Cloud-Run-runtime-specific
// detail out of local verification scope; treat as a follow-up verify item
// if limits are ever observed collapsing onto a shared proxy IP.
app.set('trust proxy', 1);

// CR-3: apply CORS headers to every response — including 400/413/429/500
// error paths — by setting them in the earliest possible middleware, ahead
// of the body parser and rate limiter. Per-handler `res.set(corsHeadersFor(req))`
// calls further down are then a harmless, idempotent overwrite. Headers set
// on `res` here persist through downstream middleware/error-handlers because
// it's the same `res` object for the lifetime of the request.
app.use((req, res, next) => {
	res.set(corsHeadersFor(req));
	next();
});

app.use(express.json({ limit: '64kb' }));

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	keyGenerator: (req) => {
		const cfConnectingIp = req.headers['cf-connecting-ip'];
		const ip = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
		// CR-4: use the library's own IPv6-safe fallback (ipKeyGenerator)
		// instead of raw `req.ip`, so a) express-rate-limit's startup
		// validation doesn't fire ERR_ERL_KEY_GEN_IPV6, and b) IPv6 clients on
		// the fallback path (no cf-connecting-ip) are bucketed by subnet
		// rather than by individual address.
		return typeof ip === 'string' && ip ? ip : ipKeyGenerator(req.ip ?? '');
	},
});

app.get('/', (_req, res) => {
	res.status(200).json({ status: 'ok', service: 'briananderson-xyz-api' });
});

app.post('/', apiLimiter, asyncHandler((req, res) => {
	const fn = process.env.FUNCTION_TARGET || 'chat';
	if (fn === 'fitfinder') {
		return handleFitFinder(req, res);
	}
	return handleChat(req, res);
}));
app.options('/', asyncHandler((req, res) => {
	const fn = process.env.FUNCTION_TARGET || 'chat';
	if (fn === 'fitfinder') {
		return handleFitFinder(req, res);
	}
	return handleChat(req, res);
}));

app.post('/chat', apiLimiter, asyncHandler((req, res) => handleChat(req, res)));
app.options('/chat', asyncHandler((req, res) => handleChat(req, res)));
app.post('/fit-finder', apiLimiter, asyncHandler((req, res) => handleFitFinder(req, res)));
app.options('/fit-finder', asyncHandler((req, res) => handleFitFinder(req, res)));

// MCP (Model Context Protocol) endpoint over Streamable HTTP. Stateless: a
// fresh server + transport per request (enableJsonResponse returns a single
// JSON-RPC response rather than an SSE stream, which suits these
// request/response tools). Rate-limited like the other endpoints.
app.post('/mcp', apiLimiter, asyncHandler(async (req, res) => {
	const server = createMcpServer();
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
	res.on('close', () => {
		transport.close();
		server.close();
	});
	await server.connect(transport);
	await transport.handleRequest(req, res, req.body);
}));
// Streamable HTTP session GET/DELETE are unused in stateless mode.
app.get('/mcp', (_req, res) => {
	res.status(405).json({ error: 'Method not allowed' });
});

app.use((err: Error & { status?: number; statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Unhandled error:', err);
	res.status(err.status ?? err.statusCode ?? 500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT} (target: ${process.env.FUNCTION_TARGET || 'chat'})`);
});
