'use strict';

/**
 * Pure filter helper for the VotingModule "Close to Being Tested" sub-module.
 *
 * Selects products whose vote count is within striking distance of the
 * 600-vote testing trigger — specifically totalVotes in [540, 600) — sorted
 * descending by votes and capped at 5 results.
 *
 * @param {Array<{ totalVotes: number }>} products
 * @returns {Array} filtered, sorted, sliced product list
 */
export function filterCloseToTested(products) {
  return (products || [])
    .filter((p) => p.totalVotes >= 540 && p.totalVotes < 600)
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 5);
}
