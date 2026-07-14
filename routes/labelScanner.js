'use strict';

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { uploadImages } = require('../services/imageUpload');
const { extractFromImages } = require('../services/visionService');
const { parseAndNormalise } = require('../services/ocrExtractor');
const { computeNutriScore } = require('../services/nutriscoreEngine');
const { classifyNOVA } = require('../services/novaClassifier');

// Supported MIME types for label images
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Multer configuration: memory storage, max 3 files, 10MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 3,
  },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(
        `Unsupported image format: ${file.mimetype}. Supported: JPEG, PNG, WebP, HEIC`
      );
      err.code = 'INVALID_FORMAT';
      cb(err, false);
    }
  },
});

/**
 * Builds a standardised error response object.
 */
function errorResponse(code, message) {
  return {
    error: {
      code,
      message,
      request_id: uuidv4(),
    },
  };
}

/**
 * Sanitises user-provided input by stripping MongoDB operator keys.
 */
function sanitiseInput(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$[a-zA-Z]+/g, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitiseInput);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitised = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      sanitised[key] = sanitiseInput(value);
    }
    return sanitised;
  }
  return obj;
}

/**
 * Attempts to compute NutriScore. Returns null if insufficient data.
 */
function tryComputeNutriScore(nutritionPer100g, category) {
  if (!nutritionPer100g) return null;

  const { energy_kcal, saturated_fat_g, sugars_g, sodium_mg } = nutritionPer100g;

  // Required fields must be present
  if (energy_kcal == null || saturated_fat_g == null || sugars_g == null || sodium_mg == null) {
    return null;
  }

  try {
    const input = {
      energy_kcal,
      saturated_fat_g,
      sugars_g,
      sodium_mg,
      fibre_g: nutritionPer100g.fibre_g ?? null,
      protein_g: nutritionPer100g.protein_g ?? null,
      fruits_veg_nuts_pct: nutritionPer100g.fruits_veg_nuts_pct ?? null,
      total_fat_g: nutritionPer100g.total_fat_g ?? null,
      category: category || 'solid',
    };

    return computeNutriScore(input);
  } catch (err) {
    return null;
  }
}

/**
 * Attempts NOVA classification. Returns null if no ingredients.
 */
function tryClassifyNOVA(ingredientsParsed) {
  if (!ingredientsParsed || ingredientsParsed.length === 0) return null;
  return classifyNOVA(ingredientsParsed);
}

/**
 * Generates warnings for low-confidence fields.
 */
function generateWarnings(fieldConfidences, missingFields) {
  const warnings = [];

  if (fieldConfidences && typeof fieldConfidences === 'object') {
    for (const [field, confidence] of Object.entries(fieldConfidences)) {
      if (typeof confidence === 'number' && confidence < 0.5) {
        warnings.push(`Low confidence for ${field} (${confidence.toFixed(2)})`);
      }
    }
  }

  if (missingFields && missingFields.length > 0) {
    warnings.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return warnings;
}

/**
 * Factory function that creates the label scanner router.
 *
 * @param {import('mongodb').Db} db - MongoDB database instance
 * @param {Function} authenticateUser - Express middleware for JWT auth
 * @returns {express.Router} Configured Express router
 */
function createLabelScannerRouter(db, authenticateUser) {
  const router = express.Router();
  const scansCollection = db.collection('label_scans');
  const productsCollection = db.collection('label_products');

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/v1/scans — Upload images, run full pipeline, return scores
  // ─────────────────────────────────────────────────────────────────────────
  router.post(
    '/scans',
    authenticateUser,
    upload.array('images', 3),
    async (req, res) => {
      try {
        console.log(`📸 POST /api/v1/scans — ${req.files?.length || 0} files from user ${req.user?.id}`);
        // 1. Validate: reject if no images uploaded
        if (!req.files || req.files.length === 0) {
          return res.status(400).json(
            errorResponse('VALIDATION_ERROR', 'At least one image is required')
          );
        }

        // 2. Validate individual file sizes (multer limit may not catch all cases)
        for (const file of req.files) {
          if (file.size > MAX_FILE_SIZE) {
            return res.status(413).json(
              errorResponse('PAYLOAD_TOO_LARGE', `File ${file.originalname} exceeds 10MB limit`)
            );
          }
        }

        // 3. Upload images to R2
        let imageResults;
        try {
          imageResults = await uploadImages(req.files);
        } catch (uploadErr) {
          console.error('❌ R2 upload failed:', uploadErr.message, uploadErr.stack);
          return res.status(500).json(
            errorResponse('STORAGE_ERROR', 'Image upload to storage failed: ' + uploadErr.message)
          );
        }

        const imageUrls = imageResults.map((r) => r.url);
        console.log('✅ Images uploaded to R2:', imageUrls);

        // 4. Extract from images via Vision Service
        let extractionResult;
        try {
          extractionResult = await extractFromImages(imageUrls);
        } catch (visionErr) {
          console.error('❌ Vision service failed:', visionErr.message, visionErr.stack);
          return res.status(503).json(
            errorResponse('SERVICE_UNAVAILABLE', 'Vision service temporarily unavailable: ' + visionErr.message)
          );
        }

        // 5. Parse and normalise via OCR Extractor
        const parsed = parseAndNormalise(extractionResult);

        // 6. Compute NutriScore (if sufficient data)
        const category = req.body.category || 'solid';
        const nutriScore = tryComputeNutriScore(parsed.nutrition_per_100g, category);

        // 7. Classify NOVA (if ingredients available)
        const novaGroup = tryClassifyNOVA(parsed.ingredients_parsed);

        // 8. Find or create product — match by barcode first, then name+brand
        const barcode = req.body.barcode || null;
        let product = null;

        if (barcode) {
          product = await productsCollection.findOne({ barcode });
        }

        if (!product && parsed.product_name && parsed.brand) {
          product = await productsCollection.findOne({
            name: parsed.product_name,
            brand: parsed.brand,
          });
        }

        const scanId = uuidv4();
        const now = new Date();
        let productId;
        let version;

        if (product) {
          productId = product.product_id;
          version = (product.scan_count || 0) + 1;
        } else {
          productId = uuidv4();
          version = 1;
        }

        // 9. Build warnings
        const warnings = generateWarnings(
          extractionResult.field_confidences,
          parsed.missing_fields
        );

        // 10. Create Scan_Record
        const scanRecord = {
          scan_id: scanId,
          product_id: productId,
          user_id: req.user.id.toString(),
          version,
          image_refs: imageUrls,
          raw_ocr_text: JSON.stringify(extractionResult),
          product_name: parsed.product_name,
          brand: parsed.brand,
          barcode,
          serving_info: parsed.serving_info,
          nutrition_per_100g: parsed.nutrition_per_100g,
          ingredients_raw: parsed.ingredients_raw,
          ingredients_parsed: parsed.ingredients_parsed,
          nutri_score: nutriScore,
          nova_group: novaGroup,
          extraction_confidence: extractionResult.extraction_confidence || 0,
          field_confidences: extractionResult.field_confidences || {},
          missing_fields: parsed.missing_fields,
          warnings,
          category,
          status: 'extracted', // extracted → pending_review → approved / rejected
          correction_log: [],
          created_at: now,
          updated_at: now,
        };

        await scansCollection.insertOne(scanRecord);

        // 11. Update or create Product_Record
        if (product) {
          await productsCollection.updateOne(
            { product_id: productId },
            {
              $set: {
                latest_scan_id: scanId,
                scan_count: version,
                latest_nutri_score_grade: nutriScore ? nutriScore.grade : null,
                latest_nova_group: novaGroup ? novaGroup.group : null,
                updated_at: now,
              },
            }
          );
        } else {
          await productsCollection.insertOne({
            product_id: productId,
            name: parsed.product_name || 'Unknown Product',
            brand: parsed.brand || 'Unknown Brand',
            barcode,
            category,
            latest_scan_id: scanId,
            scan_count: 1,
            latest_nutri_score_grade: nutriScore ? nutriScore.grade : null,
            latest_nova_group: novaGroup ? novaGroup.group : null,
            created_at: now,
            updated_at: now,
          });
        }

        // 12. Return 201 with full scan data (exclude MongoDB _id)
        const { _id, ...responseData } = scanRecord;
        return res.status(201).json(responseData);
      } catch (err) {
        console.error('POST /api/v1/scans error:', err);
        return res.status(500).json(
          errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
        );
      }
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/scans/:id — Fetch full scan record
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/scans/:id', authenticateUser, async (req, res) => {
    try {
      const scan = await scansCollection.findOne(
        { scan_id: req.params.id },
        { projection: { _id: 0 } }
      );

      if (!scan) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }

      return res.status(200).json(scan);
    } catch (err) {
      console.error('GET /api/v1/scans/:id error:', err);
      return res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/scans/:id/status — User accepts or rejects extracted data
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/scans/:id/status', authenticateUser, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending_review', 'rejected'].includes(status)) {
        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Status must be pending_review or rejected'));
      }

      const result = await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status, updated_at: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }

      return res.status(200).json({ success: true, status });
    } catch (err) {
      console.error('PATCH /api/v1/scans/:id/status error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/scans/:id — Submit corrections, trigger re-scoring
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/scans/:id', authenticateUser, async (req, res) => {
    try {
      // 1. Find existing scan
      const existingScan = await scansCollection.findOne({ scan_id: req.params.id });

      if (!existingScan) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }

      // 2. Sanitise and extract correction fields
      const corrections = sanitiseInput(req.body);
      const correctedNutrition = corrections.nutrition_per_100g || null;
      const correctedIngredientsRaw = corrections.ingredients_raw || null;
      const correctedIngredientsParsed = corrections.ingredients_parsed || null;

      // 3. Apply corrections
      let updatedNutrition = { ...existingScan.nutrition_per_100g };
      if (correctedNutrition && typeof correctedNutrition === 'object') {
        updatedNutrition = { ...updatedNutrition, ...correctedNutrition };
      }

      let updatedIngredientsRaw = existingScan.ingredients_raw;
      let updatedIngredientsParsed = [...(existingScan.ingredients_parsed || [])];

      if (correctedIngredientsRaw && typeof correctedIngredientsRaw === 'string') {
        updatedIngredientsRaw = correctedIngredientsRaw;
        updatedIngredientsParsed = correctedIngredientsRaw
          .split(/[,;]/)
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
      }

      if (correctedIngredientsParsed && Array.isArray(correctedIngredientsParsed)) {
        updatedIngredientsParsed = correctedIngredientsParsed;
      }

      // 4. Recompute NutriScore with corrected data
      const category = corrections.category || existingScan.category || 'solid';
      const nutriScore = tryComputeNutriScore(updatedNutrition, category);

      // 5. Reclassify NOVA with corrected ingredients
      const novaGroup = tryClassifyNOVA(updatedIngredientsParsed);

      // 6. Build correction_log entry
      const correctionEntry = {
        correction_id: uuidv4(),
        corrected_by: req.user.id.toString(),
        timestamp: new Date(),
        previous_values: {},
        new_values: {},
      };

      if (correctedNutrition) {
        correctionEntry.previous_values.nutrition_per_100g = existingScan.nutrition_per_100g;
        correctionEntry.new_values.nutrition_per_100g = updatedNutrition;
      }
      if (correctedIngredientsRaw || correctedIngredientsParsed) {
        correctionEntry.previous_values.ingredients_raw = existingScan.ingredients_raw;
        correctionEntry.previous_values.ingredients_parsed = existingScan.ingredients_parsed;
        correctionEntry.new_values.ingredients_raw = updatedIngredientsRaw;
        correctionEntry.new_values.ingredients_parsed = updatedIngredientsParsed;
      }

      // 7. Get current product to determine new version
      const product = await productsCollection.findOne({
        product_id: existingScan.product_id,
      });
      const newVersion = (product ? product.scan_count : existingScan.version) + 1;

      // 8. Create NEW Scan_Record (new scan_id, incremented version)
      const newScanId = uuidv4();
      const now = new Date();

      const newScanRecord = {
        scan_id: newScanId,
        product_id: existingScan.product_id,
        user_id: req.user.id.toString(),
        version: newVersion,
        image_refs: existingScan.image_refs,
        raw_ocr_text: existingScan.raw_ocr_text,
        product_name: corrections.product_name || existingScan.product_name,
        brand: corrections.brand || existingScan.brand,
        barcode: corrections.barcode || existingScan.barcode,
        serving_info: corrections.serving_info || existingScan.serving_info,
        nutrition_per_100g: updatedNutrition,
        ingredients_raw: updatedIngredientsRaw,
        ingredients_parsed: updatedIngredientsParsed,
        nutri_score: nutriScore,
        nova_group: novaGroup,
        extraction_confidence: existingScan.extraction_confidence,
        field_confidences: existingScan.field_confidences,
        missing_fields: existingScan.missing_fields,
        warnings: existingScan.warnings,
        category,
        correction_log: [...(existingScan.correction_log || []), correctionEntry],
        created_at: now,
        updated_at: now,
      };

      await scansCollection.insertOne(newScanRecord);

      // 9. Update Product_Record's latest_scan_id
      await productsCollection.updateOne(
        { product_id: existingScan.product_id },
        {
          $set: {
            latest_scan_id: newScanId,
            scan_count: newVersion,
            latest_nutri_score_grade: nutriScore ? nutriScore.grade : null,
            latest_nova_group: novaGroup ? novaGroup.group : null,
            updated_at: now,
          },
        }
      );

      // 10. Return 200 with updated scan (exclude MongoDB _id)
      const { _id, ...responseData } = newScanRecord;
      return res.status(200).json(responseData);
    } catch (err) {
      console.error('PATCH /api/v1/scans/:id error:', err);
      return res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/scans/:id/status — Update scan status (user accept/reject)
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/scans/:id/status', authenticateUser, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending_review', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Status must be pending_review or rejected'));
      }

      const result = await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status, status_updated_at: new Date(), status_updated_by: req.user.id.toString() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }

      console.log(`✅ Scan ${req.params.id} status updated to ${status} by user ${req.user.id}`);
      return res.status(200).json({ success: true, status });
    } catch (err) {
      console.error('PATCH /api/v1/scans/:id/status error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to update status'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/products — Search products with filters and pagination
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/products', authenticateUser, async (req, res) => {
    try {
      const { q, nutri_score, nova_group } = req.query;
      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 20;

      // Clamp pagination values
      if (page < 1) page = 1;
      if (limit < 1) limit = 1;
      if (limit > 100) limit = 100;

      const filter = {};

      // Search: regex-based partial matching on name, brand, barcode
      if (q && typeof q === 'string' && q.trim().length > 0) {
        const searchTerm = q.trim();
        filter.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { brand: { $regex: searchTerm, $options: 'i' } },
          { barcode: { $regex: searchTerm, $options: 'i' } },
        ];
      }

      // Filter by Nutri-Score grade
      if (nutri_score && typeof nutri_score === 'string') {
        const grade = nutri_score.toUpperCase();
        if (['A', 'B', 'C', 'D', 'E'].includes(grade)) {
          filter.latest_nutri_score_grade = grade;
        }
      }

      // Filter by NOVA group
      if (nova_group) {
        const group = parseInt(nova_group, 10);
        if ([1, 2, 3, 4].includes(group)) {
          filter.latest_nova_group = group;
        }
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        productsCollection
          .find(filter, { projection: { _id: 0 } })
          .sort({ updated_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        productsCollection.countDocuments(filter),
      ]);

      return res.status(200).json({
        products,
        total,
        page,
        limit,
      });
    } catch (err) {
      console.error('GET /api/v1/products error:', err);
      return res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/products/:id — Get product detail with latest scan data
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/products/:id', authenticateUser, async (req, res) => {
    try {
      const product = await productsCollection.findOne(
        { product_id: req.params.id },
        { projection: { _id: 0 } }
      );

      if (!product) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Product not found'));
      }

      // Fetch latest scan for this product
      let latestScan = null;
      if (product.latest_scan_id) {
        latestScan = await scansCollection.findOne(
          { scan_id: product.latest_scan_id },
          { projection: { _id: 0 } }
        );
      }

      return res.status(200).json({
        ...product,
        latest_scan: latestScan,
      });
    } catch (err) {
      console.error('GET /api/v1/products/:id error:', err);
      return res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/admin/pending-scans — Admin: list scans pending review
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/admin/pending-scans', async (req, res) => {
    try {
      const scans = await scansCollection
        .find({ status: 'pending_review' }, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .limit(50)
        .toArray();
      return res.status(200).json({ success: true, scans });
    } catch (err) {
      console.error('GET /api/v1/admin/pending-scans error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch pending scans'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/admin/scans/:id/approve — Admin approves a scan
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/admin/scans/:id/approve', async (req, res) => {
    try {
      // Update scan status
      const result = await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status: 'approved', approved_at: new Date(), updated_at: new Date() } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }

      // Fetch the scan to get barcode and product data
      const scan = await scansCollection.findOne({ scan_id: req.params.id });
      if (scan && scan.barcode) {
        // Upsert product with approved status so /lookup/:barcode finds it
        await productsCollection.updateOne(
          { barcode: scan.barcode },
          {
            $set: {
              name: scan.product_name || 'Unknown Product',
              brand: scan.brand || 'Unknown Brand',
              barcode: scan.barcode,
              category: scan.category || 'solid',
              latest_scan_id: scan.scan_id,
              latest_nutri_score_grade: scan.nutri_score?.grade || null,
              latest_nova_group: scan.nova_group?.group || null,
              status: 'approved',
              updated_at: new Date(),
            },
            $setOnInsert: {
              product_id: scan.product_id,
              scan_count: 1,
              created_at: new Date(),
            },
          },
          { upsert: true }
        );
        console.log(`✅ Admin approved scan ${req.params.id}, product stored for barcode ${scan.barcode}`);
      }

      return res.status(200).json({ success: true, message: 'Scan approved' });
    } catch (err) {
      console.error('PATCH /api/v1/admin/scans/:id/approve error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to approve scan'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/admin/scans/:id/reject — Admin rejects a scan
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/admin/scans/:id/reject', async (req, res) => {
    try {
      const result = await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status: 'admin_rejected', updated_at: new Date() } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      }
      return res.status(200).json({ success: true, message: 'Scan rejected' });
    } catch (err) {
      console.error('PATCH /api/v1/admin/scans/:id/reject error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to reject scan'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/verified-product/:barcode — Check our DB first for approved scans
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/verified-product/:barcode', async (req, res) => {
    try {
      const scan = await scansCollection.findOne(
        { barcode: req.params.barcode, status: 'approved' },
        { projection: { _id: 0 }, sort: { created_at: -1 } }
      );
      if (!scan) {
        return res.status(404).json({ found: false });
      }
      return res.status(200).json({ found: true, product: scan });
    } catch (err) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to check verified products'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: GET /api/v1/admin/scans/pending — List scans pending admin review
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/admin/scans/pending', async (req, res) => {
    try {
      const scans = await scansCollection
        .find({ status: 'pending_review' })
        .sort({ created_at: -1 })
        .project({ _id: 0 })
        .toArray();
      return res.status(200).json({ success: true, scans });
    } catch (err) {
      console.error('GET /admin/scans/pending error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch pending scans'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: PATCH /api/v1/admin/scans/:id/approve — Approve a scan
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/admin/scans/:id/approve', async (req, res) => {
    try {
      const scan = await scansCollection.findOne({ scan_id: req.params.id });
      if (!scan) return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));

      // Update scan status to approved
      await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status: 'approved', approved_at: new Date() } }
      );

      // Update/create product with approved status so barcode lookups find it
      if (scan.barcode) {
        await productsCollection.updateOne(
          { barcode: scan.barcode },
          {
            $set: {
              name: scan.product_name || 'Unknown Product',
              brand: scan.brand || 'Unknown Brand',
              barcode: scan.barcode,
              category: scan.category || 'solid',
              latest_scan_id: scan.scan_id,
              latest_nutri_score_grade: scan.nutri_score?.grade || null,
              latest_nova_group: scan.nova_group?.group || null,
              status: 'approved',
              updated_at: new Date(),
            },
            $setOnInsert: {
              product_id: scan.product_id,
              scan_count: 1,
              created_at: new Date(),
            },
          },
          { upsert: true }
        );
      }

      console.log(`✅ Admin approved scan ${req.params.id} (barcode: ${scan.barcode})`);
      return res.status(200).json({ success: true, message: 'Scan approved' });
    } catch (err) {
      console.error('PATCH /admin/scans/:id/approve error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to approve scan'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: PATCH /api/v1/admin/scans/:id/reject — Reject a scan
  // ─────────────────────────────────────────────────────────────────────────
  router.patch('/admin/scans/:id/reject', async (req, res) => {
    try {
      const result = await scansCollection.updateOne(
        { scan_id: req.params.id },
        { $set: { status: 'admin_rejected', rejected_at: new Date() } }
      );
      if (result.matchedCount === 0) return res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found'));
      return res.status(200).json({ success: true, message: 'Scan rejected' });
    } catch (err) {
      console.error('PATCH /admin/scans/:id/reject error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to reject scan'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC: GET /api/v1/lookup/:barcode — Check our DB first for approved data
  // ─────────────────────────────────────────────────────────────────────────
  router.get('/lookup/:barcode', async (req, res) => {
    try {
      // Check our approved products first
      const product = await productsCollection.findOne({
        barcode: req.params.barcode,
        status: 'approved',
      });

      if (product) {
        // Fetch the latest approved scan
        const scan = await scansCollection.findOne(
          { scan_id: product.latest_scan_id },
          { projection: { _id: 0 } }
        );
        return res.status(200).json({
          found: true,
          source: 'choosepure',
          product: {
            name: product.name,
            brand: product.brand,
            barcode: product.barcode,
            nutriScore: scan?.nutri_score?.grade || null,
            novaGroup: scan?.nova_group?.group || null,
            nutritionPer100g: scan?.nutrition_per_100g || null,
            ingredients: scan?.ingredients_raw || '',
            imageUrl: scan?.image_refs?.[0] || null,
          },
        });
      }

      return res.status(200).json({ found: false });
    } catch (err) {
      console.error('GET /api/v1/lookup/:barcode error:', err);
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Lookup failed'));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling middleware for multer errors
  // ─────────────────────────────────────────────────────────────────────────
  router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json(
          errorResponse('PAYLOAD_TOO_LARGE', 'File size exceeds 10MB limit')
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Maximum 3 images allowed')
        );
      }
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', err.message)
      );
    }

    if (err && err.code === 'INVALID_FORMAT') {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', err.message)
      );
    }

    next(err);
  });

  return router;
}

module.exports = createLabelScannerRouter;
