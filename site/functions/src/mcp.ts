/**
 * MCP (Model Context Protocol) server for briananderson.xyz.
 *
 * Exposes Brian's resume, projects, skills, chatbot, and fit-finder as MCP
 * tools so any MCP-capable agent can query them directly. The application
 * exposes Streamable HTTP at POST /mcp; which deployed API service publicly
 * routes that endpoint is an external configuration concern.
 *
 * The tools reuse the existing logic rather than reimplementing it:
 * - get_resume fetches the deployed JSONResume endpoints
 * - search_projects / search_skills use the same ContentTools + content index
 *   the chatbot uses
 * - ask_brian / analyze_fit invoke the real chat / fit-finder handlers through
 *   a lightweight response adapter, so guardrails and grounding are identical
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { fetchContentIndex, handleChat, handleFitFinder } from './handlers.js';
import { ContentTools } from './tools.js';

const SITE_URL = process.env.SITE_URL || 'https://briananderson.xyz';

const SERVER_INFO = { name: 'briananderson-xyz', version: '1.0.0' } as const;

/**
 * Invoke an Express-style handler (handleChat / handleFitFinder) in-process and
 * capture its JSON response, so MCP tools reuse the exact same request logic,
 * guardrails, and grounding without an HTTP round-trip or duplicated code.
 */
function invokeHandler(
	handler: (req: Request, res: Response) => unknown,
	body: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
	return new Promise((resolve, reject) => {
		let statusCode = 200;
		const req = { method: 'POST', headers: {}, body } as unknown as Request;
		const res = {
			set: () => res,
			setHeader: () => res,
			status: (code: number) => {
				statusCode = code;
				return res;
			},
			json: (payload: Record<string, unknown>) => {
				resolve({ status: statusCode, data: payload });
				return res;
			},
			send: (payload: unknown) => {
				resolve({ status: statusCode, data: { body: payload } });
				return res;
			},
			end: () => {
				resolve({ status: statusCode, data: {} });
				return res;
			},
		} as unknown as Response;
		Promise.resolve(handler(req, res)).catch(reject);
	});
}

function textResult(value: unknown, isError = false) {
	const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
	return { content: [{ type: 'text' as const, text }], isError };
}

/**
 * Build a fresh MCP server with all tools registered. In stateless Streamable
 * HTTP mode a new instance is created per request.
 */
export function createMcpServer(): McpServer {
	const server = new McpServer(SERVER_INFO);

	server.registerTool(
		'get_resume',
		{
			title: "Get Brian's resume",
			description:
				"Return Brian Anderson's resume as JSONResume. Optionally pass a variant to emphasize a persona: 'leader' (default, enterprise architecture and strategy), 'ops' (platform/DevOps), or 'builder' (hands-on building).",
			inputSchema: { variant: z.enum(['leader', 'ops', 'builder']).optional() },
		},
		async ({ variant }) => {
			const path =
				variant === 'ops' ? '/ops/resume.json' : variant === 'builder' ? '/builder/resume.json' : '/resume.json';
			const response = await fetch(`${SITE_URL}${path}`);
			if (!response.ok) {
				return textResult(`Failed to fetch resume (${response.status}).`, true);
			}
			return textResult(await response.text());
		}
	);

	server.registerTool(
		'search_projects',
		{
			title: "Search Brian's projects",
			description:
				"Search Brian's projects by keyword (e.g. 'agent', 'kubernetes', 'observability'). Returns matching projects with summaries and links.",
			inputSchema: { query: z.string().min(1).describe('Keywords to search projects for') },
		},
		async ({ query }) => {
			const index = await fetchContentIndex();
			if (!index) return textResult('Content index is unavailable.', true);
			const keywords = query.trim().split(/\s+/).filter(Boolean);
			return textResult(new ContentTools(index).searchProjects(keywords));
		}
	);

	server.registerTool(
		'search_skills',
		{
			title: "Search Brian's skills",
			description:
				"Search Brian's skills by keyword (e.g. 'rust', 'terraform', 'ai'). Returns matching skills with the projects and posts that evidence them.",
			inputSchema: { query: z.string().min(1).describe('Keywords to search skills for') },
		},
		async ({ query }) => {
			const index = await fetchContentIndex();
			if (!index) return textResult('Content index is unavailable.', true);
			const keywords = query.trim().split(/\s+/).filter(Boolean);
			return textResult(new ContentTools(index).searchSkills(keywords));
		}
	);

	server.registerTool(
		'ask_brian',
		{
			title: 'Ask Brian a question',
			description:
				"Ask a free-form question about Brian's background, experience, or work. Answered by the same AI assistant that powers the site chatbot, grounded in Brian's real content.",
			inputSchema: { question: z.string().min(1).describe('The question to ask') },
		},
		async ({ question }) => {
			const { status, data } = await invokeHandler(handleChat, { message: question, history: [] });
			if (status >= 400) {
				return textResult(String(data.error || 'Chat request failed.'), true);
			}
			return textResult(String(data.response ?? ''));
		}
	);

	server.registerTool(
		'analyze_fit',
		{
			title: 'Analyze fit for a role',
			description:
				"Score how well Brian fits a role. Pass the job description; returns a structured analysis (fit score, matching skills and experience, gaps, and a recommended resume variant).",
			inputSchema: {
				job_description: z.string().min(1).describe('The full job description to analyze'),
				variant: z.enum(['leader', 'ops', 'builder']).optional(),
			},
		},
		async ({ job_description, variant }) => {
			const { status, data } = await invokeHandler(handleFitFinder, {
				jobDescription: job_description,
				variant,
			});
			if (status >= 400) {
				return textResult(String(data.error || 'Fit analysis failed.'), true);
			}
			return textResult(data.analysis ?? data);
		}
	);

	return server;
}
