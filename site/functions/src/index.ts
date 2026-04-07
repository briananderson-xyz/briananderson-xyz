/**
 * Firebase Functions v2 wrappers for local development only.
 * Production uses Cloud Run via server.ts + Dockerfile.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { handleChat } from './handlers.js';
import { handleFitFinder } from './handlers.js';

// Initialize Firebase Admin (needed for local emulator)
initializeApp();

export const chat = onRequest(
	{
		cors: true,
		maxInstances: 10,
		secrets: ['GEMINI_API_KEY']
	},
	handleChat
);

export const fitFinder = onRequest(
	{
		cors: true,
		maxInstances: 10,
		secrets: ['GEMINI_API_KEY']
	},
	handleFitFinder
);
