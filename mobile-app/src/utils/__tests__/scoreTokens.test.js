/**
 * Property-Based Tests — Score Token System
 *
 * Property 1: Lab Score caption always present
 *   For any score 0–100, ScoreBadge renders a "Lab Score" caption.
 *   Validates: Requirements 1.2
 *
 * Property 2: Score token color is band-correct
 *   For any score 0–100, getLabScoreToken returns the correct color for
 *   the band it falls in. Two scores in the same band return the same color.
 *   Validates: Requirements 2.1, 2.2
 */

import fc from 'fast-check';
import { getLabScoreToken, LAB_SCORE_BANDS } from '../scoreTokens';

// ── Expected band→color mapping ──────────────────────────────────────────────

const EXPECTED_BANDS = [
  { min: 0,  max: 39,  color: '#D62828', band: 'poor' },
  { min: 40, max: 69,  color: '#FFB703', band: 'moderate' },
  { min: 70, max: 100, color: '#1F6B4E', band: 'good' },
];

function expectedColor(score) {
  const band = EXPECTED_BANDS.find((b) => score >= b.min && score <= b.max);
  return band ? band.color : '#D62828';
}

function expectedBand(score) {
  const band = EXPECTED_BANDS.find((b) => score >= b.min && score <= b.max);
  return band ? band.band : 'poor';
}

// ── Property 2: Score token color is band-correct ────────────────────────────

describe('getLabScoreToken — Property 2: band-correct color', () => {
  test('returns the correct hex color for any integer score 0–100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const token = getLabScoreToken(score);
        expect(token.color).toBe(expectedColor(score));
      }),
      { numRuns: 100 },
    );
  });

  test('two scores in the same band always return the same color', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (scoreA, scoreB) => {
          const sameBand = expectedBand(scoreA) === expectedBand(scoreB);
          const tokenA = getLabScoreToken(scoreA);
          const tokenB = getLabScoreToken(scoreB);
          if (sameBand) {
            expect(tokenA.color).toBe(tokenB.color);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('LAB_SCORE_BANDS covers every integer in 0–100 with no gaps', () => {
    for (let score = 0; score <= 100; score++) {
      const token = getLabScoreToken(score);
      expect(token.color).toBeDefined();
      expect(token.band).toBeDefined();
      expect(token.label).toBeDefined();
    }
  });
});

// ── Property 1: Lab Score caption always present ─────────────────────────────

import React from 'react';
import { render } from '@testing-library/react-native';
import ScoreBadge from '../../components/ScoreBadge';

describe('ScoreBadge — Property 1: Lab Score caption always present', () => {
  test('renders a "Lab Score" caption for any integer score 0–100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const { getByText, unmount } = render(<ScoreBadge score={score} />);
        expect(getByText('Lab Score')).toBeTruthy();
        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
