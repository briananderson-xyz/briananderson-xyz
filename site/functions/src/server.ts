/**
 * Express server for Cloud Run deployment.
 * Production entry point — Dockerfile runs this instead of index.ts.
 *
 * Local dev uses Firebase emulators via index.ts.
 * CI/CD builds this into a container and deploys to Cloud Run.
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

// Chat endpoint
app.post('/chat', (req, res) => handleChat(req, res));
app.options('/chat', (req, res) => handleChat(req, res));

// Fit Finder endpoint
app.post('/fit-finder', (req, res) => handleFitFinder(req, res));
app.options('/fit-finder', (req, res) => handleFitFinder(req, res));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT}`);
});
