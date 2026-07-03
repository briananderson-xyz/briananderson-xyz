import { describe, it, expect } from 'vitest';
import { getDuration } from './date';

// Only fixed start+end ranges are asserted; the PRESENT/open-ended branch
// depends on the current date and is intentionally not pinned here.
describe('getDuration', () => {
	it('counts an inclusive span within a single year', () => {
		// Jan..Mar inclusive = 3 mos
		expect(getDuration('January 2020', 'March 2020')).toBe('3 mos');
	});

	it('rolls 12 months up into a year', () => {
		// Jan 2020..Dec 2020 inclusive = 12 mos -> 1 yr
		expect(getDuration('January 2020', 'December 2020')).toBe('1 yr');
	});

	it('formats mixed years and months with pluralization', () => {
		// Jan 2018..Mar 2020 inclusive = 2 yrs 3 mos
		expect(getDuration('January 2018', 'March 2020')).toBe('2 yrs 3 mos');
	});

	it('uses singular yr and mo where appropriate', () => {
		// Jan 2019..Feb 2020 inclusive = 1 yr 2 mos
		expect(getDuration('January 2019', 'February 2020')).toBe('1 yr 2 mos');
	});
});
