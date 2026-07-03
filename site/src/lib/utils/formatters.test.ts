import { describe, it, expect } from 'vitest';
import { formatJobTitles } from './formatters';

describe('formatJobTitles', () => {
	it('returns empty string for no titles', () => {
		expect(formatJobTitles([])).toBe('');
		expect(formatJobTitles(undefined as unknown as string[])).toBe('');
	});

	it('returns the single title unchanged', () => {
		expect(formatJobTitles(['Engineer'])).toBe('Engineer');
	});

	it('joins two titles with an ampersand', () => {
		expect(formatJobTitles(['Engineer', 'Architect'])).toBe('Engineer & Architect');
	});

	it('comma-separates three or more with an ampersand before the last', () => {
		expect(formatJobTitles(['A', 'B', 'C'])).toBe('A, B & C');
		expect(formatJobTitles(['A', 'B', 'C', 'D'])).toBe('A, B, C & D');
	});
});
