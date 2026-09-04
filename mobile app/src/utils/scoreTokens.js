'use strict';

/**
 * Score Token System — shared source of truth for Lab Score and Nutri-Score colors.
 *
 * Lab Score: 0-100 numeric → band → color
 * Nutri-Score: A-E letter → band → color
 *
 * Both use the same 4-color semantic scale (red→amber→light-green→dark-green)
 * so both reinforce "good → bad." Differentiation comes from shape and label,
 * not color-blocking them apart.
 */

// ── Lab Score Bands ──────────────────────────────────────────────────────────

export const LAB_SCORE_BANDS = [
  { min: 0,  max: 40,  band: 'poor',      color: '#D64545', label: 'Poor' },
  { min: 41, max: 60,  band: 'moderate',  color: '#E8A33D', label: 'Moderate' },
  { min: 61, max: 80,  band: 'good',      color: '#7CB342', label: 'Good' },
  { min: 81, max: 100, band: 'excellent', color: '#2E7D32', label: 'Excellent' },
];

/**
 * Returns the score token for a given 0-100 lab score.
 * @param {number} score
 * @returns {{ band: string, color: string, label: string }}
 */
export function getLabScoreToken(score) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const band of LAB_SCORE_BANDS) {
    if (clamped >= band.min && clamped <= band.max) {
      return { band: band.band, color: band.color, label: band.label };
    }
  }
  // Fallback (shouldn't happen with valid input)
  return { band: 'poor', color: '#D64545', label: 'Poor' };
}

// ── Nutri-Score Tokens ───────────────────────────────────────────────────────

export const NUTRI_SCORE_TOKENS = {
  A: { band: 'excellent', color: '#2E7D32', label: 'A' },
  B: { band: 'good',      color: '#7CB342', label: 'B' },
  C: { band: 'moderate',  color: '#E8A33D', label: 'C' },
  D: { band: 'poor',      color: '#EF6C00', label: 'D' },
  E: { band: 'poor',      color: '#D64545', label: 'E' },
};

/**
 * Returns the score token for a given Nutri-Score grade letter.
 * @param {string} grade - 'A' | 'B' | 'C' | 'D' | 'E'
 * @returns {{ band: string, color: string, label: string }}
 */
export function getNutriScoreToken(grade) {
  const upper = (grade || 'E').toUpperCase();
  return NUTRI_SCORE_TOKENS[upper] || NUTRI_SCORE_TOKENS['E'];
}
