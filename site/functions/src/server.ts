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

const app = express();
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
	res.status(200).json({ status: 'ok', service: 'briananderson-xyz-api' });
});

// The Cloudflare Worker routes to the service root, so POST / is the main handler.
// /chat and /fit-finder paths are also supported for direct access.
app.post('/', (req, res) => {
	const fn = process.env.FUNCTION_TARGET || 'chat';
	if (fn === 'fitfinder') {
		return handleFitFinder(req, res);
	}
	return handleChat(req, res);
});
app.options('/', (req, res) => {
	const fn = process.env.FUNCTION_TARGET || 'chat';
	if (fn === 'fitfinder') {
		return handleFitFinder(req, res);
	}
	return handleChat(req, res);
});

// Also support explicit paths for direct access / testing
app.post('/chat', (req, res) => handleChat(req, res));
app.options('/chat', (req, res) => handleChat(req, res));
app.post('/fit-finder', (req, res) => handleFitFinder(req, res));
app.options('/fit-finder', (req, res) => handleFitFinder(req, res));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT} (target: ${process.env.FUNCTION_TARGET || 'chat'})`);
});
