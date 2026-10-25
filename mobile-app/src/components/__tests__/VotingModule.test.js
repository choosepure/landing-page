/**
 * Property-Based Tests — VotingModule
 *
 * Property 3: "Close to Tested" filter correctness
 *   For any array of products with arbitrary totalVotes, filterCloseToTested
 *   returns only products with totalVotes in [540, 600), sorted descending,
 *   capped at 5 results.
 *   Validates: Requirements 5.2
 */

import fc from 'fast-check';
// Import the pure filter directly from its util module to avoid pulling in
// native dependencies (AsyncStorage via apiClient) through the component.
import { filterCloseToTested } from '../../utils/voteFilters';

describe('filterCloseToTested — Property 3: close-to-tested filter correctness', () => {
  const productArb = fc.record({
    _id: fc.uuid(),
    productName: fc.string(),
    totalVotes: fc.integer({ min: 0, max: 800 }),
  });

  test('all returned products have totalVotes in [540, 600)', () => {
    fc.assert(
      fc.property(fc.array(productArb), (products) => {
        const result = filterCloseToTested(products);
        result.forEach((p) => {
          expect(p.totalVotes).toBeGreaterThanOrEqual(540);
          expect(p.totalVotes).toBeLessThan(600);
        });
      }),
      { numRuns: 100 },
    );
  });

  test('result length is at most 5', () => {
    fc.assert(
      fc.property(fc.array(productArb), (products) => {
        expect(filterCloseToTested(products).length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 },
    );
  });

  test('result is sorted descending by totalVotes', () => {
    fc.assert(
      fc.property(fc.array(productArb), (products) => {
        const result = filterCloseToTested(products);
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].totalVotes).toBeGreaterThanOrEqual(result[i + 1].totalVotes);
        }
      }),
      { numRuns: 100 },
    );
  });

  test('returns exactly the in-band products when there are 5 or fewer', () => {
    fc.assert(
      fc.property(fc.array(productArb), (products) => {
        const inBand = products.filter(
          (p) => p.totalVotes >= 540 && p.totalVotes < 600,
        );
        const result = filterCloseToTested(products);
        const expectedCount = Math.min(inBand.length, 5);
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });

  test('handles null/undefined input gracefully', () => {
    expect(filterCloseToTested(null)).toEqual([]);
    expect(filterCloseToTested(undefined)).toEqual([]);
    expect(filterCloseToTested([])).toEqual([]);
  });
});
