'use strict';

/**
 * Pure helper — decides whether the "Popular doesn't always mean healthy"
 * caption should be shown under the Popular Products section.
 *
 * The caption is required whenever at least one product carries a low
 * Nutri-Score grade (C, D, or E).
 *
 * @param {string[]} grades - Array of Nutri-Score grade letters (any case)
 * @returns {boolean} true if the caption should be shown
 */
export function shouldShowCaption(grades) {
  if (!Array.isArray(grades)) return false;
  return grades.some((g) => ['C', 'D', 'E'].includes((g || '').toUpperCase()));
}

export const POPULAR_CAPTION =
  "Popular doesn't always mean healthy — check before you buy";
