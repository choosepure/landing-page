'use strict';

/**
 * NOVA Group Classifier
 *
 * Classifies food products into NOVA Groups (1–4) based on ingredient analysis.
 * Pure function module — no I/O, no side effects.
 *
 * NOVA Groups:
 *   1 — Unprocessed or minimally processed foods
 *   2 — Processed culinary ingredients
 *   3 — Processed foods
 *   4 — Ultra-processed food and drink products
 */

// ---------------------------------------------------------------------------
// GROUP 4 MARKERS — Ultra-processing indicators
// ---------------------------------------------------------------------------

const GROUP_4_MARKERS = [
  // E-number additives (e.g., E471, E300a)
  /^e\d{3,4}[a-z]?$/i,
  // Flavour indicators
  /\b(flavou?r|flavou?ring|artificial flavou?r)\b/i,
  // Colour indicators
  /\b(colou?r|colou?ring|artificial colou?r)\b/i,
  // Emulsifiers
  /\b(emulsifier|lecithin|mono[- ]?and[- ]?diglycerides)\b/i,
  // Stabilisers and thickeners
  /\b(stabiliser|thickener|xanthan|carrageenan|guar gum)\b/i,
  // Sweeteners
  /\b(aspartame|sucralose|acesulfame|saccharin|stevia extract)\b/i,
  // Hydrogenated oils
  /\b(hydrogenated|partially hydrogenated)\b/i,
  // High-fructose corn syrup
  /\b(high[- ]?fructose|HFCS|corn syrup)\b/i,
  // Protein isolates
  /\b(protein isolate|hydrolysed protein|hydrolyzed protein)\b/i,
  // MSG and flavour enhancers
  /\b(monosodium glutamate|MSG|flavou?r enhancer)\b/i,
  // Maltodextrin, invert sugar, dextrose
  /\b(maltodextrin|invert sugar|dextrose)\b/i,
];

// ---------------------------------------------------------------------------
// GROUP 2 MARKERS — Processed culinary ingredients
// ---------------------------------------------------------------------------

const GROUP_2_MARKERS = [
  // Single culinary substances (exact match)
  /^(salt|sugar|honey|oil|butter|flour|vinegar|spices?)$/i,
  // Named oils and ghee
  /\b(olive oil|coconut oil|sunflower oil|vegetable oil|ghee)\b/i,
  // Sugar variants
  /\b(cane sugar|brown sugar|jaggery|palm sugar)\b/i,
];

// ---------------------------------------------------------------------------
// SYNONYMS — Common alternative names resolved to canonical forms
// ---------------------------------------------------------------------------

const SYNONYMS = {
  'msg': 'monosodium glutamate',
  'hfcs': 'high-fructose corn syrup',
  'partially hydrogenated oil': 'hydrogenated oil',
  'vanillin': 'artificial flavour',
};

// ---------------------------------------------------------------------------
// SYNONYM & NORMALISATION HELPERS
// ---------------------------------------------------------------------------

/**
 * Normalise an ingredient string by applying:
 *  1. Lowercase and trim
 *  2. Synonym resolution (case-insensitive)
 *  3. INS number → E-number conversion (Indian numbering system)
 *
 * @param {string} ingredient - Raw ingredient string
 * @returns {string} Normalised ingredient string
 */
function normaliseSynonyms(ingredient) {
  let normalised = ingredient.toLowerCase().trim();

  // Apply synonym replacements
  for (const [synonym, canonical] of Object.entries(SYNONYMS)) {
    if (normalised.includes(synonym)) {
      normalised = normalised.replace(synonym, canonical);
    }
  }

  // Convert INS numbers to E-numbers (e.g., "INS 471" → "e471", "ins300" → "e300")
  normalised = normalised.replace(/\bins\s*(\d{3,4}[a-z]?)\b/i, 'e$1');

  return normalised;
}

// ---------------------------------------------------------------------------
// CLASSIFICATION LOGIC
// ---------------------------------------------------------------------------

/**
 * Classify a product into a NOVA Group (1–4) based on its ingredient list.
 *
 * Classification priority (highest group wins):
 *   1. Group 4 — any ultra-processing marker detected
 *   2. Group 3 — ≥2 ingredients combining Group 1 foods + Group 2 substances
 *   3. Group 2 — single ingredient matching a culinary substance
 *   4. Group 1 — default (unprocessed/minimally processed)
 *
 * @param {string[]} ingredients - Array of ingredient strings
 * @returns {{ group: number|null, reason: string, matched_markers: string[] }}
 */
function classifyNOVA(ingredients) {
  // Handle empty/null ingredients
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return {
      group: null,
      reason: 'No ingredients available for NOVA classification',
      matched_markers: [],
    };
  }

  // Step 0: Normalise all ingredients
  const normalised = ingredients.map(normaliseSynonyms);

  // Step 1: Check for Group 4 markers (highest priority — ultra-processed)
  const group4Matches = [];
  for (const ingredient of normalised) {
    for (const marker of GROUP_4_MARKERS) {
      if (marker.test(ingredient)) {
        group4Matches.push(ingredient);
        break; // One match per ingredient is enough
      }
    }
  }

  if (group4Matches.length > 0) {
    return {
      group: 4,
      reason: `Ultra-processed: contains ${group4Matches[0]}`,
      matched_markers: group4Matches,
    };
  }

  // Step 2: Check for Group 3 (processed foods)
  // Requires ≥2 ingredients combining Group 1 foods with Group 2 substances
  const group2Matches = normalised.filter((ing) =>
    GROUP_2_MARKERS.some((marker) => marker.test(ing))
  );
  const group1Count = normalised.length - group2Matches.length;

  if (normalised.length >= 2 && group2Matches.length >= 1 && group1Count >= 1) {
    return {
      group: 3,
      reason: 'Processed: combines whole foods with culinary ingredients',
      matched_markers: group2Matches,
    };
  }

  // Step 3: Check for Group 2 (single culinary ingredient)
  if (normalised.length === 1 && GROUP_2_MARKERS.some((m) => m.test(normalised[0]))) {
    return {
      group: 2,
      reason: 'Processed culinary ingredient',
      matched_markers: [normalised[0]],
    };
  }

  // Step 4: Default to Group 1 (unprocessed/minimally processed)
  return {
    group: 1,
    reason: 'Unprocessed or minimally processed',
    matched_markers: [],
  };
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

module.exports = {
  classifyNOVA,
  normaliseSynonyms,
  // Exported for testing purposes
  GROUP_4_MARKERS,
  GROUP_2_MARKERS,
  SYNONYMS,
};
