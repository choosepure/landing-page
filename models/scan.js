'use strict';

/**
 * Scan_Record Schema (MongoDB: `label_scans` collection)
 *
 * @typedef {Object} ScanRecord
 * @property {string} scan_id - UUID v4, unique identifier for this scan
 * @property {string} product_id - UUID v4, reference to the associated product
 * @property {string} user_id - User identifier from JWT
 * @property {number} version - Scan version number, starts at 1
 * @property {string[]} image_refs - URLs to uploaded label images in R2
 * @property {string} raw_ocr_text - Full Vision API response text
 * @property {string|null} product_name - Extracted product name
 * @property {string|null} brand - Extracted brand/manufacturer
 * @property {string|null} barcode - Barcode if available
 * @property {Object|null} serving_info - Serving size information
 * @property {number} serving_info.value - Numeric serving size
 * @property {string} serving_info.unit - Unit: 'g', 'ml', or 'piece'
 * @property {number|null} serving_info.servings_per_container - Number of servings
 * @property {Object} nutrition_per_100g - Nutritional values per 100g
 * @property {number|null} nutrition_per_100g.energy_kcal
 * @property {number|null} nutrition_per_100g.energy_kj
 * @property {number|null} nutrition_per_100g.total_fat_g
 * @property {number|null} nutrition_per_100g.saturated_fat_g
 * @property {number|null} nutrition_per_100g.trans_fat_g
 * @property {number|null} nutrition_per_100g.carbohydrates_g
 * @property {number|null} nutrition_per_100g.sugars_g
 * @property {number|null} nutrition_per_100g.added_sugars_g
 * @property {number|null} nutrition_per_100g.fibre_g
 * @property {number|null} nutrition_per_100g.protein_g
 * @property {number|null} nutrition_per_100g.sodium_mg
 * @property {number|null} nutrition_per_100g.cholesterol_mg
 * @property {number|null} nutrition_per_100g.fruits_veg_nuts_pct
 * @property {string|null} ingredients_raw - Raw ingredient list text
 * @property {string[]} ingredients_parsed - Parsed individual ingredient strings
 * @property {Object|null} nutri_score - Computed Nutri-Score
 * @property {string} nutri_score.grade - 'A', 'B', 'C', 'D', or 'E'
 * @property {number} nutri_score.net_score - Net score value
 * @property {number} nutri_score.negative_points - Negative points total
 * @property {number} nutri_score.positive_points - Positive points total
 * @property {Object} nutri_score.breakdown - Point breakdown per component
 * @property {Object|null} nova_group - NOVA classification result
 * @property {number} nova_group.group - 1, 2, 3, or 4
 * @property {string} nova_group.reason - Explanation for classification
 * @property {string[]} nova_group.matched_markers - Markers that triggered classification
 * @property {number} extraction_confidence - Overall confidence score (0.0–1.0)
 * @property {Object} field_confidences - Per-field confidence scores
 * @property {string[]} missing_fields - Fields that could not be extracted
 * @property {string[]} warnings - Warning messages (e.g., low confidence)
 * @property {string} category - 'solid', 'beverages', 'cheese', or 'fats_and_oils'
 * @property {Array} correction_log - Array of correction entries
 * @property {Date} created_at - Document creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

const COLLECTION_NAME = 'label_scans';

/**
 * Creates all required indexes on the label_scans collection.
 * @param {import('mongodb').Db} db - MongoDB database instance
 * @returns {Promise<void>}
 */
async function ensureIndexes(db) {
  const collection = db.collection(COLLECTION_NAME);

  await Promise.all([
    // Unique index on scan_id for fast lookup by ID
    collection.createIndex({ scan_id: 1 }, { unique: true }),

    // Compound index for fetching all versions of a product's scans (newest first)
    collection.createIndex({ product_id: 1, version: -1 }),

    // Compound index for fetching a user's scans sorted by date
    collection.createIndex({ user_id: 1, created_at: -1 }),

    // Index for global time-ordered scan queries
    collection.createIndex({ created_at: -1 }),
  ]);
}

module.exports = {
  COLLECTION_NAME,
  ensureIndexes,
};
