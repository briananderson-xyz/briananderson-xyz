import { describe, it, expect } from 'vitest';
import { ResumeSchema } from './resume';

const validResume = {
	name: 'Brian Anderson',
	jobTitles: ['Engineering Leader', 'Builder'],
	tagline: 'Builds things that prove their work.',
	email: 'brian@example.com',
	location: 'Chicago, IL',
	summary: 'A summary.',
	skills: {
		'Cloud & Infrastructure': [{ name: 'AWS', url: 'https://aws.amazon.com/' }, { name: 'GCP' }]
	},
	experience: [
		{
			role: 'Principal Engineer',
			company: 'Acme',
			location: 'Remote',
			start_date: 'January 2020',
			highlights: ['Did a thing', { text: 'Linked thing', link: '/x' }]
		}
	],
	education: [{ school: 'State U', degree: 'BS', location: 'Anytown', start_date: 'September 2010' }],
	certificates: [
		{ name: 'AWS SA', url: 'https://aws.amazon.com/certification/', start_date: 'January 2021' }
	]
};

describe('ResumeSchema', () => {
	it('accepts a well-formed resume', () => {
		const result = ResumeSchema.safeParse(validResume);
		expect(result.success).toBe(true);
	});

	it('rejects a resume missing a required field', () => {
		const missingName: Partial<typeof validResume> = { ...validResume };
		delete missingName.name;
		const result = ResumeSchema.safeParse(missingName);
		expect(result.success).toBe(false);
	});

	it('rejects a malformed skill entry', () => {
		const bad = { ...validResume, skills: { Cloud: [{ url: 'https://x.example' }] } };
		const result = ResumeSchema.safeParse(bad);
		expect(result.success).toBe(false);
	});
});
