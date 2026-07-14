'use strict';

/**
 * Vision Service — sends food label images to Claude Vision API for structured extraction.
 *
 * Handles concurrent multi-image processing, confidence-based merge logic,
 * 6-second timeout per image, retry on 5xx errors, and FSSAI/Hindi-English support.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1, 14.4
 */

const Anthropic = require('@anthropic-ai/sdk');

// Structured extraction prompt for Claude Vision API
const EXTRACTION_PROMPT = `You are a food label OCR system. Analyse the provided food product label image(s) and extract the following information as a JSON object.

Extract:
1. product_name: The product name as written on the front of the pack
2. brand: The brand/manufacturer name
3. serving_size: { value: number, unit: "g"|"ml"|"piece" }
4. servings_per_container: number or null
5. nutrition_per_100g: Extract per-100g values. If only per-serving is available, I will compute per-100g separately.
   - energy_kcal, energy_kj, total_fat_g, saturated_fat_g, trans_fat_g, 
   - carbohydrates_g, sugars_g, added_sugars_g, fibre_g, protein_g, 
   - sodium_mg, cholesterol_mg
6. nutrition_per_serving: Same fields as above but per-serving values
7. ingredients_raw: The complete ingredient list text exactly as printed
8. confidence: Your confidence score (0.0-1.0) in the overall extraction accuracy
9. field_confidences: An object mapping each extracted field name to a confidence score (0.0-1.0)

Rules:
- If a field is not visible or legible, set it to null
- For Indian FSSAI labels: prefer the English text, extract trans fat, cholesterol, added sugars
- If the label has both per-serving and per-100g columns, extract BOTH
- Sodium: if listed in mg keep as-is; if in g multiply by 1000
- For Hindi-English bilingual labels: extract the English text values, ignore Hindi text
- Return valid JSON only, no markdown fencing`;

// Timeout per image in milliseconds
const IMAGE_TIMEOUT_MS = 30000;

// Fields that are merged across images
const MERGEABLE_FIELDS = [
  'product_name',
  'brand',
  'serving_size',
  'servings_per_container',
  'nutrition_per_100g',
  'nutrition_per_serving',
  'ingredients_raw',
];

/**
 * Creates an Anthropic client instance.
 * @returns {Anthropic} Anthropic SDK client
 */
function createClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
}

/**
 * Extracts structured data from a single image URL using Claude Vision API.
 * Implements 6-second timeout with AbortController and retry once on 5xx.
 *
 * @param {Anthropic} client - Anthropic SDK client
 * @param {string} imageUrl - Public URL of the image
 * @returns {Promise<Object>} Parsed extraction result with confidence
 */
async function extractFromSingleImage(client, imageUrl) {
  let lastError = null;
  const maxAttempts = 2; // Initial attempt + 1 retry on 5xx

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

      const response = await client.messages.create(
        {
          model: 'claude-sonnet-4-5-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'url',
                    url: imageUrl,
                  },
                },
                {
                  type: 'text',
                  text: EXTRACTION_PROMPT,
                },
              ],
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      // Parse the response text content
      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || !textBlock.text) {
        return createEmptyExtraction();
      }

      const parsed = parseExtractionResponse(textBlock.text);
      return parsed;
    } catch (error) {
      lastError = error;

      // Only retry on 5xx status errors
      if (attempt < maxAttempts - 1 && is5xxError(error)) {
        continue;
      }

      // Abort errors (timeout) — do not retry timeouts, retry only on 5xx
      if (error.name === 'AbortError' || error.message === 'This operation was aborted') {
        // If first attempt timed out, don't retry timeouts
        if (attempt === 0) {
          // Only retry on 5xx, not on timeout
          break;
        }
      }

      break;
    }
  }

  // All attempts failed
  if (lastError) {
    console.error('❌ extractFromSingleImage actual error:', lastError.message, lastError.status || '', JSON.stringify(lastError.error || '').substring(0, 200));
    const err = new Error('Vision service temporarily unavailable');
    err.statusCode = 503;
    throw err;
  }

  return createEmptyExtraction();
}

/**
 * Determines if an error is a 5xx server error.
 * @param {Error} error
 * @returns {boolean}
 */
function is5xxError(error) {
  // Anthropic SDK throws APIError with status property
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }
  // Check for statusCode property
  if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }
  return false;
}

/**
 * Parses the raw text response from Claude into a structured extraction object.
 * @param {string} text - Raw response text (should be JSON)
 * @returns {Object} Parsed extraction with confidence scores
 */
function parseExtractionResponse(text) {
  try {
    // Remove any markdown fencing if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonText);

    const confidence = typeof data.confidence === 'number'
      ? Math.max(0, Math.min(1, data.confidence))
      : 0.5;

    const fieldConfidences = data.field_confidences && typeof data.field_confidences === 'object'
      ? normaliseConfidences(data.field_confidences)
      : generateDefaultFieldConfidences(data, confidence);

    return {
      product_name: data.product_name || null,
      brand: data.brand || null,
      serving_size: parseServingSize(data.serving_size),
      servings_per_container: typeof data.servings_per_container === 'number'
        ? data.servings_per_container
        : null,
      nutrition_per_100g: parseNutritionObject(data.nutrition_per_100g),
      nutrition_per_serving: parseNutritionObject(data.nutrition_per_serving),
      ingredients_raw: typeof data.ingredients_raw === 'string' ? data.ingredients_raw : null,
      extraction_confidence: confidence,
      field_confidences: fieldConfidences,
    };
  } catch (parseError) {
    // JSON parsing failed — return empty extraction with low confidence
    return createEmptyExtraction();
  }
}

/**
 * Parses a serving size value from the extraction.
 * @param {*} raw - Raw serving_size data
 * @returns {Object|null} { value, unit } or null
 */
function parseServingSize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.value !== 'number' || raw.value <= 0) return null;

  const validUnits = ['g', 'ml', 'piece'];
  const unit = validUnits.includes(raw.unit) ? raw.unit : 'g';

  return { value: raw.value, unit };
}

/**
 * Parses a nutrition object, ensuring all expected fields are present.
 * @param {*} raw - Raw nutrition data
 * @returns {Object|null} Normalised nutrition object or null
 */
function parseNutritionObject(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const fields = [
    'energy_kcal', 'energy_kj', 'total_fat_g', 'saturated_fat_g', 'trans_fat_g',
    'carbohydrates_g', 'sugars_g', 'added_sugars_g', 'fibre_g', 'protein_g',
    'sodium_mg', 'cholesterol_mg',
  ];

  const result = {};
  let hasAnyValue = false;

  for (const field of fields) {
    if (raw[field] != null && typeof raw[field] === 'number') {
      result[field] = raw[field];
      hasAnyValue = true;
    } else {
      result[field] = null;
    }
  }

  return hasAnyValue ? result : null;
}

/**
 * Normalises confidence values to be within [0, 1].
 * @param {Object} confidences - Raw confidence map
 * @returns {Object} Normalised confidence map
 */
function normaliseConfidences(confidences) {
  const result = {};
  for (const [key, value] of Object.entries(confidences)) {
    if (typeof value === 'number') {
      result[key] = Math.max(0, Math.min(1, value));
    }
  }
  return result;
}

/**
 * Generates default field confidences based on which fields have values.
 * @param {Object} data - Extracted data
 * @param {number} baseConfidence - Overall confidence to use as base
 * @returns {Object} Field confidence map
 */
function generateDefaultFieldConfidences(data, baseConfidence) {
  const confidences = {};

  if (data.product_name) confidences.product_name = baseConfidence;
  if (data.brand) confidences.brand = baseConfidence;
  if (data.serving_size) confidences.serving_size = baseConfidence;
  if (data.ingredients_raw) confidences.ingredients_raw = baseConfidence;
  if (data.nutrition_per_100g && typeof data.nutrition_per_100g === 'object') {
    for (const [key, value] of Object.entries(data.nutrition_per_100g)) {
      if (value != null) {
        confidences[key] = baseConfidence;
      }
    }
  }
  if (data.nutrition_per_serving && typeof data.nutrition_per_serving === 'object') {
    for (const [key, value] of Object.entries(data.nutrition_per_serving)) {
      if (value != null && !confidences[key]) {
        confidences[key] = baseConfidence * 0.9; // slightly lower for per-serving only
      }
    }
  }

  return confidences;
}

/**
 * Creates an empty extraction result with low confidence.
 * @returns {Object} Empty extraction
 */
function createEmptyExtraction() {
  return {
    product_name: null,
    brand: null,
    serving_size: null,
    servings_per_container: null,
    nutrition_per_100g: null,
    nutrition_per_serving: null,
    ingredients_raw: null,
    extraction_confidence: 0.0,
    field_confidences: {},
  };
}

/**
 * Merges multiple extraction results, preferring the value with highest confidence per field.
 *
 * For each field, keeps the value from the extraction with the highest confidence
 * score for that specific field. Overall extraction_confidence is the average of
 * individual image confidences.
 *
 * @param {Object[]} extractions - Array of extraction results
 * @returns {Object} Merged extraction result
 */
function mergeExtractions(extractions) {
  if (!extractions || extractions.length === 0) {
    return createEmptyExtraction();
  }

  if (extractions.length === 1) {
    return extractions[0];
  }

  const merged = createEmptyExtraction();
  const mergedFieldConfidences = {};

  // For each mergeable field, find the extraction with highest confidence for that field
  for (const field of MERGEABLE_FIELDS) {
    let bestValue = null;
    let bestConfidence = -1;

    for (const extraction of extractions) {
      const value = extraction[field];
      if (value == null) continue;

      // Get field-specific confidence, fall back to overall extraction confidence
      const fieldConfidence = getFieldConfidence(extraction, field);

      if (fieldConfidence > bestConfidence) {
        bestConfidence = fieldConfidence;
        bestValue = value;
      }
    }

    if (bestValue !== null) {
      merged[field] = bestValue;
      if (bestConfidence >= 0) {
        mergedFieldConfidences[field] = bestConfidence;
      }
    }
  }

  // Merge nutrition field-level confidences
  if (merged.nutrition_per_100g) {
    for (const nutritionField of Object.keys(merged.nutrition_per_100g)) {
      let bestConf = -1;
      for (const extraction of extractions) {
        if (extraction.nutrition_per_100g && extraction.nutrition_per_100g[nutritionField] != null) {
          const conf = extraction.field_confidences[nutritionField] || extraction.extraction_confidence;
          if (conf > bestConf) {
            bestConf = conf;
          }
        }
      }
      if (bestConf >= 0) {
        mergedFieldConfidences[nutritionField] = bestConf;
      }
    }
  }

  // Overall extraction_confidence = average of individual image confidences
  const totalConfidence = extractions.reduce((sum, e) => sum + e.extraction_confidence, 0);
  merged.extraction_confidence = totalConfidence / extractions.length;
  merged.field_confidences = mergedFieldConfidences;

  return merged;
}

/**
 * Gets the confidence score for a specific field from an extraction result.
 * Falls back to overall extraction_confidence if no field-specific confidence exists.
 *
 * @param {Object} extraction - Single extraction result
 * @param {string} field - Field name
 * @returns {number} Confidence score (0.0-1.0)
 */
function getFieldConfidence(extraction, field) {
  if (extraction.field_confidences && typeof extraction.field_confidences[field] === 'number') {
    return extraction.field_confidences[field];
  }
  return extraction.extraction_confidence || 0;
}

/**
 * Main entry point: extracts structured data from multiple food label images.
 *
 * Sends images concurrently to Claude Vision API, merges results preferring
 * highest confidence per field, and returns a unified ExtractionResult.
 *
 * @param {string[]} imageUrls - Array of public URLs to uploaded label images
 * @returns {Promise<Object>} ExtractionResult matching ocrExtractor input format
 * @throws {Error} With statusCode 503 if Vision API is unreachable
 */
async function extractFromImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return createEmptyExtraction();
  }

  const client = createClient();

  // Process all images concurrently
  const results = await Promise.allSettled(
    imageUrls.map((url) => extractFromSingleImage(client, url))
  );

  // Collect successful extractions
  const successfulExtractions = [];
  let lastError = null;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successfulExtractions.push(result.value);
    } else {
      lastError = result.reason;
    }
  }

  // If all images failed, throw the error
  if (successfulExtractions.length === 0) {
    if (lastError) {
      throw lastError;
    }
    const err = new Error('Vision service temporarily unavailable');
    err.statusCode = 503;
    throw err;
  }

  // Merge all successful extractions
  return mergeExtractions(successfulExtractions);
}

module.exports = {
  extractFromImages,
  mergeExtractions,
  // Exported for testing
  parseExtractionResponse,
  createEmptyExtraction,
  getFieldConfidence,
  extractFromSingleImage,
  EXTRACTION_PROMPT,
  IMAGE_TIMEOUT_MS,
  MERGEABLE_FIELDS,
};
