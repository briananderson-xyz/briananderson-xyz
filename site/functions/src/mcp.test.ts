/**
 * node:test coverage for the MCP server wiring in site/functions/src/mcp.ts.
 * Uses the SDK's in-memory transport + client so the test is hermetic: it
 * exercises the real MCP handshake and tool registration without a network
 * call, an HTTP server, or Gemini. Run via `pnpm test`.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from './mcp.js';

const EXPECTED_TOOLS = ['get_resume', 'search_projects', 'search_skills', 'ask_brian', 'analyze_fit'];

async function connectedClient(): Promise<{ client: Client; close: () => Promise<void> }> {
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	const server = createMcpServer();
	const client = new Client({ name: 'test', version: '1.0.0' });
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
	return {
		client,
		close: async () => {
			await client.close();
			await server.close();
		},
	};
}

describe('MCP server', () => {
	test('completes the initialize handshake and advertises tool capability', async () => {
		const { client, close } = await connectedClient();
		const caps = client.getServerCapabilities();
		assert.ok(caps?.tools, 'server should advertise tools capability');
		await close();
	});

	test('registers exactly the expected tools', async () => {
		const { client, close } = await connectedClient();
		const { tools } = await client.listTools();
		const names = tools.map((t) => t.name).sort();
		assert.deepEqual(names, [...EXPECTED_TOOLS].sort());
		await close();
	});

	test('every tool exposes a description and input schema', async () => {
		const { client, close } = await connectedClient();
		const { tools } = await client.listTools();
		for (const tool of tools) {
			assert.ok(tool.description && tool.description.length > 0, `${tool.name} needs a description`);
			assert.equal(tool.inputSchema?.type, 'object', `${tool.name} needs an object input schema`);
		}
		await close();
	});

	test('search tools require their query argument', async () => {
		const { client, close } = await connectedClient();
		const { tools } = await client.listTools();
		for (const name of ['search_projects', 'search_skills']) {
			const schema = tools.find((t) => t.name === name)?.inputSchema as
				| { required?: string[] }
				| undefined;
			assert.ok(schema?.required?.includes('query'), `${name} should require "query"`);
		}
		await close();
	});
});
