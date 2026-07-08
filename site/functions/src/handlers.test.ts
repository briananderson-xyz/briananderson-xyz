/**
 * node:test coverage for fit-finder response finalization.
 * Run via `pnpm test` from site/functions.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { completeFitAnalysis } from './handlers.js';
import { ContentTools } from './tools.js';
import type { ContentIndex } from './types.js';

function contentToolsFixture(): ContentTools {
	const index: ContentIndex = {
		skills: [
			{ name: 'TypeScript', category: 'Engineering', projects: [], blog: [] },
			{ name: 'Node.js', category: 'Engineering', projects: [], blog: [] },
			{ name: 'AI workflows', category: 'AI', projects: [], blog: [] }
		],
		experience: [
			{
				role: 'Principal Engineer',
				company: 'Kontour',
				dateRange: '2024-present',
				location: 'Remote',
				description: 'Built AI-enabled developer workflow systems.',
				highlights: ['Led TypeScript and Node.js developer workflow automation']
			}
		],
		projects: [],
		blog: [],
		resume: {
			name: 'Brian Anderson',
			title: 'Engineering Leader',
			tagline: 'Builder and operator',
			summary: 'Builds engineering systems.',
			location: 'United States',
			email: 'brian@example.com',
			skillCategories: {},
			certificates: []
		},
		metadata: {
			buildDate: '2026-07-08T00:00:00Z',
			version: 'test',
			projectCount: 0,
			blogCount: 0,
			skillCount: 3,
			experienceCount: 1
		}
	};

	return new ContentTools(index);
}

describe('completeFitAnalysis', () => {
	test('returns deterministic fallback analysis when the model produced no analysis', () => {
		const analysis = completeFitAnalysis(
			contentToolsFixture(),
			'Senior TypeScript developer with React and Node experience',
			'builder',
			null
		);

		assert.equal(typeof analysis.fitScore, 'number');
		assert.ok(['good', 'maybe', 'not'].includes(String(analysis.fitLevel)));
		assert.equal(analysis.resumeVariantRecommendation, 'builder');
		assert.ok(Array.isArray(analysis.matchingSkills));
		assert.ok((analysis.matchingSkills as unknown[]).length > 0);
		assert.ok(Array.isArray(analysis.gaps));
		assert.ok(
			(analysis.gaps as string[]).some((gap) => gap.includes('React-specific depth')),
			'fallback should still call out React as a gap'
		);
		assert.match(String(analysis.analysis), /partial fit|strong fit|limited fit/);
	});
});
