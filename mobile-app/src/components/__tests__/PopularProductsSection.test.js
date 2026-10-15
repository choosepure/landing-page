/**
 * Property-Based Tests — Popular Products caption visibility
 *
 * Property 4: Cautionary caption visibility follows grade set
 *   For any array of Nutri-Score grades, shouldShowCaption returns true iff
 *   at least one grade is C, D, or E; false when all grades are A/B or the
 *   array is empty.
 *   Validates: Requirements 8.3, 8.4
 */

import fc from 'fast-check';
import { shouldShowCaption } from '../../utils/popularCaption';

const ALL_GRADES = ['A', 'B', 'C', 'D', 'E'];
const LOW_GRADES = ['C', 'D', 'E'];

describe('shouldShowCaption — Property 4: caption visibility follows grade set', () => {
  test('returns true iff at least one grade is C, D, or E', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...ALL_GRADES)), (grades) => {
        const hasLowGrade = grades.some((g) => LOW_GRADES.includes(g));
        expect(shouldShowCaption(grades)).toBe(hasLowGrade);
      }),
      { numRuns: 100 },
    );
  });

  test('returns false for arrays containing only A and B grades', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('A', 'B')), (grades) => {
        expect(shouldShowCaption(grades)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  test('is case-insensitive on grade letters', () => {
    fc.assert(
      fc.property(fc.constantFrom('c', 'd', 'e'), (lowerGrade) => {
        expect(shouldShowCaption([lowerGrade])).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  test('returns false for empty array and non-array input', () => {
    expect(shouldShowCaption([])).toBe(false);
    expect(shouldShowCaption(null)).toBe(false);
    expect(shouldShowCaption(undefined)).toBe(false);
  });
});
