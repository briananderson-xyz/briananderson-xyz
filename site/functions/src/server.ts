/**
 * Express server for Cloud Run deployment.
 * Production entry point — Dockerfile runs this instead of index.ts.
 *
 * Each Cloud Run service is dedicated to one function (chat or fit-finder).
 * The Cloudflare Worker routes /chat → chat service, /fit-finder → fitfinder service.
 * So each service handles POST at root (/).
 *
 * Local dev uses Firebase emulators via index.ts.
 */
import express from 'express';
import { handleChat } from './handlers.js';
import { handleFitFinder } from './handlers.js';

const asyncHandler = (fn: express.RequestHandler) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
	res.status(200).json({ status: 'ok', service: 'briananderson-xyz-api' });
});

app.post('/', asyncHandler((req, res) => {
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

app.post('/chat', asyncHandler((req, res) => handleChat(req, res)));
app.options('/chat', asyncHandler((req, res) => handleChat(req, res)));
app.post('/fit-finder', asyncHandler((req, res) => handleFitFinder(req, res)));
app.options('/fit-finder', asyncHandler((req, res) => handleFitFinder(req, res)));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Unhandled error:', err);
	res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT} (target: ${process.env.FUNCTION_TARGET || 'chat'})`);
});
