'use strict';

/**
 * Product_Record Schema (MongoDB: `label_products` collection)
 *
 * @typedef {Object} ProductRecord
 * @property {string} product_id - UUID v4, unique identifier for this product
 * @property {string} name - Product name
 * @property {string} brand - Brand/manufacturer name
 * @property {string|null} barcode - EAN/UPC barcode if available
 * @property {string} category - 'solid', 'beverages', 'cheese', or 'fats_and_oils'
 * @property {string} latest_scan_id - scan_id of the most recent scan for this product
 * @property {number} scan_count - Total number of scans for this product
 * @property {Date} created_at - Document creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

const COLLECTION_NAME = 'label_products';

/**
 * Creates all required indexes on the label_products collection.
 * @param {import('mongodb').Db} db - MongoDB database instance
 * @returns {Promise<void>}
 */
async function ensureIndexes(db) {
  const collection = db.collection(COLLECTION_NAME);

  await Promise.all([
    // Unique index on product_id for fast lookup
    collection.createIndex({ product_id: 1 }, { unique: true }),

    // Text index for full-text search on name, brand, and barcode
    collection.createIndex(
      { name: 'text', brand: 'text', barcode: 'text' }
    ),

    // Index for filtering products by Nutri-Score grade
    collection.createIndex({ 'latest_nutri_score_grade': 1 }),

    // Index for filtering products by NOVA group
    collection.createIndex({ 'latest_nova_group': 1 }),

    // Sparse index on barcode (not all products have barcodes)
    collection.createIndex({ barcode: 1 }, { sparse: true }),
  ]);
}

module.exports = {
  COLLECTION_NAME,
  ensureIndexes,
};
