'use strict';

/**
 * NutriScore Engine — 2021 FSA / Santé Publique France algorithm
 * Pure function module. No I/O, no side effects.
 *
 * Computes Nutri-Score grade (A–E) from structured nutritional data per 100g.
 */

// ─── Threshold Tables ───────────────────────────────────────────────────────

/**
 * Solid food negative point thresholds.
 * Each array contains 10 threshold values. A value exceeding threshold[i]
 * earns (i+1) points. Maximum 10 points per component.
 */
const SOLID_THRESHOLDS = {
  energy: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350],
  saturated_fat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  sugars: [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45],
  sodium: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900],
};

/**
 * Beverage-specific negative point thresholds for energy and sugars.
 * Saturated fat and sodium use solid thresholds for beverages.
 */
const BEVERAGE_THRESHOLDS = {
  energy: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270],
  saturated_fat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  sugars: [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5],
  sodium: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900],
};

/**
 * Positive point thresholds.
 * Fibre and protein: 5 thresholds → 0–5 points.
 * Fruits/Veg/Nuts: special scale (0, 1, 2, 5 points possible).
 */
const POSITIVE_THRESHOLDS = {
  fibre: [0.9, 1.9, 2.8, 3.7, 4.7],
  protein: [1.6, 3.2, 4.8, 6.4, 8.0],
  fruits_veg_nuts: [40, 60, 80],
};

/**
 * FVN points mapping: thresholds at 40, 60, 80
 * Points awarded: >40 → 1, >60 → 2, >80 → 5
 * (Points 3 and 4 are not possible for FVN)
 */
const FVN_POINTS_MAP = [1, 2, 5];

// ─── Grade Assignment Tables ────────────────────────────────────────────────

/**
 * Solid food grade boundaries (upper inclusive bounds for each grade).
 * A: net_score ≤ -1
 * B: net_score 0–2
 * C: net_score 3–10
 * D: net_score 11–18
 * E: net_score ≥ 19
 */
const SOLID_GRADES = [
  { grade: 'A', max: -1 },
  { grade: 'B', max: 2 },
  { grade: 'C', max: 10 },
  { grade: 'D', max: 18 },
  // E: everything above 18
];

/**
 * Beverage grade boundaries.
 * A: net_score ≤ 1
 * B: net_score 2–5
 * C: net_score 6–9
 * D: net_score 10–13
 * E: net_score ≥ 14
 */
const BEVERAGE_GRADES = [
  { grade: 'A', max: 1 },
  { grade: 'B', max: 5 },
  { grade: 'C', max: 9 },
  { grade: 'D', max: 13 },
  // E: everything above 13
];

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Looks up points for a given value against a threshold array.
 * Returns the number of thresholds the value exceeds (0 to array.length).
 *
 * @param {number} value - The nutritional value to look up
 * @param {number[]} thresholds - Array of ascending threshold values
 * @returns {number} Points earned (0 to thresholds.length)
 */
function lookupPoints(value, thresholds) {
  let points = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (value > thresholds[i]) {
      points = i + 1;
    } else {
      break;
    }
  }
  return points;
}

/**
 * Looks up FVN (fruits/vegetables/nuts) points with special mapping.
 * Only awards 0, 1, 2, or 5 points (3 and 4 are not possible).
 *
 * @param {number} value - FVN percentage (0–100)
 * @returns {number} Points (0, 1, 2, or 5)
 */
function lookupFVNPoints(value) {
  let points = 0;
  for (let i = 0; i < POSITIVE_THRESHOLDS.fruits_veg_nuts.length; i++) {
    if (value > POSITIVE_THRESHOLDS.fruits_veg_nuts[i]) {
      points = FVN_POINTS_MAP[i];
    } else {
      break;
    }
  }
  return points;
}

/**
 * Assigns a grade based on net score and category.
 *
 * @param {number} netScore - The computed net score
 * @param {string} category - Product category
 * @returns {string} Grade letter (A–E)
 */
function assignGrade(netScore, category) {
  const gradeTable = category === 'beverages' ? BEVERAGE_GRADES : SOLID_GRADES;

  for (const { grade, max } of gradeTable) {
    if (netScore <= max) {
      return grade;
    }
  }
  return 'E';
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Custom validation error class for NutriScore input validation.
 */
class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields || [];
  }
}

/**
 * Validates the NutriScore input object.
 * Rejects negative values for required nutritional fields and
 * rejects saturated_fat_g > total_fat_g when total_fat_g is provided.
 *
 * @param {object} input - NutriScoreInput object
 * @throws {ValidationError} If input is invalid
 */
function validate(input) {
  const invalidFields = [];

  // Check required fields for negative values
  if (input.energy_kcal < 0) {
    invalidFields.push('energy_kcal');
  }
  if (input.saturated_fat_g < 0) {
    invalidFields.push('saturated_fat_g');
  }
  if (input.sugars_g < 0) {
    invalidFields.push('sugars_g');
  }
  if (input.sodium_mg < 0) {
    invalidFields.push('sodium_mg');
  }

  // Check optional positive fields for negative values
  if (input.fibre_g != null && input.fibre_g < 0) {
    invalidFields.push('fibre_g');
  }
  if (input.protein_g != null && input.protein_g < 0) {
    invalidFields.push('protein_g');
  }
  if (input.fruits_veg_nuts_pct != null && input.fruits_veg_nuts_pct < 0) {
    invalidFields.push('fruits_veg_nuts_pct');
  }

  if (invalidFields.length > 0) {
    throw new ValidationError(
      `Invalid negative value(s) for field(s): ${invalidFields.join(', ')}`,
      invalidFields
    );
  }

  // Check saturated fat vs total fat logical constraint
  if (
    input.total_fat_g != null &&
    input.saturated_fat_g > input.total_fat_g
  ) {
    throw new ValidationError(
      'saturated_fat_g cannot exceed total_fat_g',
      ['saturated_fat_g', 'total_fat_g']
    );
  }
}

// ─── Main Computation ───────────────────────────────────────────────────────

/**
 * Computes the Nutri-Score for a given nutritional input.
 *
 * Pure function — no I/O, no side effects.
 *
 * @param {object} input - NutriScoreInput object
 * @param {number} input.energy_kcal - Energy in kcal per 100g
 * @param {number} input.saturated_fat_g - Saturated fat in grams per 100g
 * @param {number} input.sugars_g - Sugars in grams per 100g
 * @param {number} input.sodium_mg - Sodium in milligrams per 100g
 * @param {number|null} [input.fibre_g] - Fibre in grams per 100g (null → 0 points)
 * @param {number|null} [input.protein_g] - Protein in grams per 100g (null → 0 points)
 * @param {number|null} [input.fruits_veg_nuts_pct] - Fruits/veg/nuts % (null → 0 points)
 * @param {number|null} [input.total_fat_g] - Total fat for validation (optional)
 * @param {string} [input.category='solid'] - Product category: 'solid', 'beverages', 'cheese', 'fats_and_oils'
 * @returns {object} NutriScoreResult
 * @throws {ValidationError} If input contains invalid values
 */
function computeNutriScore(input) {
  // Validate input
  validate(input);

  const category = input.category || 'solid';

  // Select threshold table based on category
  const thresholds =
    category === 'beverages' ? BEVERAGE_THRESHOLDS : SOLID_THRESHOLDS;

  // ── Compute negative points (0–40) ──
  // Energy thresholds are in kJ — convert kcal to kJ (1 kcal = 4.184 kJ)
  const energy_kj = input.energy_kcal * 4.184;
  const energy_pts = lookupPoints(energy_kj, thresholds.energy);
  const sat_fat_pts = lookupPoints(input.saturated_fat_g, thresholds.saturated_fat);
  const sugars_pts = lookupPoints(input.sugars_g, thresholds.sugars);
  const sodium_pts = lookupPoints(input.sodium_mg, thresholds.sodium);
  const negative_points = energy_pts + sat_fat_pts + sugars_pts + sodium_pts;

  // ── Compute positive points (0–15) ──
  const fibre_pts = lookupPoints(input.fibre_g ?? 0, POSITIVE_THRESHOLDS.fibre);
  const fvn_pts = lookupFVNPoints(input.fruits_veg_nuts_pct ?? 0);
  let protein_pts = lookupPoints(input.protein_g ?? 0, POSITIVE_THRESHOLDS.protein);

  // Protein rule: exclude protein if negative_points ≥ 11 AND FVN < 80%
  // Exception: cheese and fats_and_oils always count protein
  const isCheeseFats = category === 'cheese' || category === 'fats_and_oils';
  if (
    !isCheeseFats &&
    negative_points >= 11 &&
    (input.fruits_veg_nuts_pct ?? 0) < 80
  ) {
    protein_pts = 0;
  }

  const positive_points = fibre_pts + protein_pts + fvn_pts;

  // ── Compute net score ──
  const net_score = negative_points - positive_points;

  // ── Assign grade ──
  const grade = assignGrade(net_score, category);

  return {
    grade,
    net_score,
    negative_points,
    positive_points,
    breakdown: {
      energy_pts,
      sat_fat_pts,
      sugars_pts,
      sodium_pts,
      fibre_pts,
      protein_pts,
      fvn_pts,
    },
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  computeNutriScore,
  ValidationError,
  // Exported for testing purposes
  lookupPoints,
  lookupFVNPoints,
  assignGrade,
  SOLID_THRESHOLDS,
  BEVERAGE_THRESHOLDS,
  POSITIVE_THRESHOLDS,
};
