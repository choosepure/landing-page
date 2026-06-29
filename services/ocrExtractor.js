'use strict';

/**
 * OCR Extractor — parses Vision API extraction results into structured nutritional data.
 *
 * Pure function module (no I/O, no side effects).
 * Handles FSSAI-specific fields: trans_fat_g, cholesterol_mg, added_sugars_g.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.2, 14.3
 */

// Required fields that trigger missing_fields detection when null
const REQUIRED_FIELDS = ['energy_kcal', 'saturated_fat_g', 'sugars_g', 'sodium_mg'];

/**
 * All nutrition fields in the NutritionPer100g object.
 * Includes FSSAI-specific fields: trans_fat_g, cholesterol_mg, added_sugars_g.
 */
const NUTRITION_FIELDS = [
  'energy_kcal',
  'energy_kj',
  'total_fat_g',
  'saturated_fat_g',
  'trans_fat_g',
  'carbohydrates_g',
  'sugars_g',
  'added_sugars_g',
  'fibre_g',
  'protein_g',
  'sodium_mg',
  'cholesterol_mg',
  'fruits_veg_nuts_pct',
];

/**
 * Converts per-serving nutritional values to per-100g.
 *
 * @param {Object} perServingValues - Object with nutrition field keys and numeric/null values
 * @param {Object} servingSize - { value: number, unit: string }
 * @returns {Object|null} - Per-100g values or null if serving size is invalid
 */
function convertToPerHundredGrams(perServingValues, servingSize) {
  if (!servingSize || !servingSize.value || servingSize.value <= 0) {
    return null;
  }

  const factor = 100 / servingSize.value;
  const result = {};

  for (const [key, value] of Object.entries(perServingValues)) {
    if (value !== null && value !== undefined && typeof value === 'number') {
      result[key] = Math.round(value * factor * 100) / 100;
    } else {
      result[key] = null;
    }
  }

  return result;
}

/**
 * Parses a serving size string or object into a structured ServingInfo object.
 *
 * @param {Object|null} servingSizeData - { value, unit } from extraction
 * @param {number|null} servingsPerContainer - servings per container from extraction
 * @returns {Object|null} - ServingInfo { value, unit, servings_per_container } or null
 */
function parseServingInfo(servingSizeData, servingsPerContainer) {
  if (!servingSizeData || !servingSizeData.value || servingSizeData.value <= 0) {
    return null;
  }

  const validUnits = ['g', 'ml', 'piece'];
  const unit = validUnits.includes(servingSizeData.unit)
    ? servingSizeData.unit
    : 'g'; // default to grams if unit is unrecognised

  return {
    value: servingSizeData.value,
    unit: unit,
    servings_per_container:
      servingsPerContainer != null && servingsPerContainer > 0
        ? servingsPerContainer
        : null,
  };
}

/**
 * Parses raw nutrition data from extraction into a NutritionPer100g object.
 * Ensures all expected fields are present (set to null if missing).
 *
 * @param {Object|null} rawNutrition - Raw nutrition object from extraction
 * @returns {Object} - NutritionPer100g with all fields present
 */
function parseNutritionFields(rawNutrition) {
  const result = {};

  for (const field of NUTRITION_FIELDS) {
    if (rawNutrition && rawNutrition[field] != null && typeof rawNutrition[field] === 'number') {
      result[field] = rawNutrition[field];
    } else {
      result[field] = null;
    }
  }

  return result;
}

/**
 * Splits raw ingredient text into an array of individual ingredients.
 * Handles comma and semicolon delimiters, trims whitespace, preserves order,
 * and filters out empty strings.
 *
 * @param {string|null} ingredientsRaw - Raw ingredient list text
 * @returns {string[]} - Array of individual ingredient strings
 */
function parseIngredients(ingredientsRaw) {
  if (!ingredientsRaw || typeof ingredientsRaw !== 'string') {
    return [];
  }

  return ingredientsRaw
    .split(/[,;]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);
}

/**
 * Detects missing required nutritional fields from a NutritionPer100g object.
 *
 * @param {Object} nutritionPer100g - The parsed NutritionPer100g object
 * @returns {string[]} - Array of field names that are null
 */
function detectMissingFields(nutritionPer100g) {
  const missing = [];

  for (const field of REQUIRED_FIELDS) {
    if (nutritionPer100g[field] == null) {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Main parsing and normalisation function.
 * Takes an extraction result from the Vision Service and returns structured data.
 *
 * Logic:
 * 1. Prefer nutrition_per_100g directly if available (Requirement 14.3)
 * 2. If only nutrition_per_serving is available, convert using serving size (Requirement 4.4)
 * 3. Parse serving_size into ServingInfo (Requirement 4.2)
 * 4. Split ingredients_raw into ingredients_parsed (Requirement 4.3)
 * 5. Detect missing required fields (Requirement 4.5)
 * 6. Map FSSAI fields: trans_fat_g, cholesterol_mg, added_sugars_g (Requirement 14.2)
 *
 * @param {Object} extraction - ExtractionResult from Vision Service
 * @returns {Object} - { product_name, brand, nutrition_per_100g, serving_info, ingredients_raw, ingredients_parsed, missing_fields, extraction_confidence }
 */
function parseAndNormalise(extraction) {
  if (!extraction || typeof extraction !== 'object') {
    return {
      product_name: null,
      brand: null,
      nutrition_per_100g: parseNutritionFields(null),
      serving_info: null,
      ingredients_raw: null,
      ingredients_parsed: [],
      missing_fields: [...REQUIRED_FIELDS],
      extraction_confidence: 0,
    };
  }

  // Parse serving info
  const servingInfo = parseServingInfo(
    extraction.serving_size,
    extraction.servings_per_container
  );

  // Determine nutrition_per_100g:
  // Prefer per-100g column when available (Requirement 14.3)
  let nutritionPer100g;

  if (extraction.nutrition_per_100g && typeof extraction.nutrition_per_100g === 'object') {
    // Use per-100g values directly (preferred)
    nutritionPer100g = parseNutritionFields(extraction.nutrition_per_100g);
  } else if (extraction.nutrition_per_serving && typeof extraction.nutrition_per_serving === 'object') {
    // Convert per-serving values to per-100g using serving size
    const converted = convertToPerHundredGrams(extraction.nutrition_per_serving, servingInfo);
    if (converted) {
      nutritionPer100g = parseNutritionFields(converted);
    } else {
      // Cannot convert without valid serving size
      nutritionPer100g = parseNutritionFields(null);
    }
  } else {
    nutritionPer100g = parseNutritionFields(null);
  }

  // Parse ingredients
  const ingredientsParsed = parseIngredients(extraction.ingredients_raw);

  // Detect missing required fields
  const missingFields = detectMissingFields(nutritionPer100g);

  return {
    product_name: extraction.product_name || null,
    brand: extraction.brand || null,
    nutrition_per_100g: nutritionPer100g,
    serving_info: servingInfo,
    ingredients_raw: extraction.ingredients_raw || null,
    ingredients_parsed: ingredientsParsed,
    missing_fields: missingFields,
    extraction_confidence: typeof extraction.extraction_confidence === 'number' ? extraction.extraction_confidence : 0,
  };
}

module.exports = {
  parseAndNormalise,
  convertToPerHundredGrams,
  parseServingInfo,
  parseNutritionFields,
  parseIngredients,
  detectMissingFields,
  NUTRITION_FIELDS,
  REQUIRED_FIELDS,
};
