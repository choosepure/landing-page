# Implementation Plan: Food Label Scanner

## Overview

This plan implements the Food Label Scanner feature as an extension of the existing ChoosePure Node.js/Express backend and React Native/Expo mobile app. The approach builds foundational pure-function scoring engines first (with property-based tests), then infrastructure layers (image storage, vision AI), then API routes with persistence, and finally mobile integration. Each task builds incrementally on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Implement NutriScore Engine (pure function)
  - [x] 1.1 Create `services/nutriscoreEngine.js` with threshold tables and `computeNutriScore` function
    - Implement solid food negative point thresholds (energy, saturated fat, sugars, sodium) with `lookupPoints` helper
    - Implement beverage-specific thresholds for energy and sugars
    - Implement positive point thresholds (fibre, protein, fruits/veg/nuts)
    - Implement protein rule: exclude protein points if negative_points ≥ 11 and FVN < 80%
    - Implement cheese/fats exception: always count protein points
    - Implement grade assignment for solid and beverage categories
    - Implement input validation: reject negative values, reject saturated_fat > total_fat
    - Return `{ grade, net_score, negative_points, positive_points, breakdown }` structure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 16.1, 16.3, 16.4_

  - [ ]* 1.2 Write property tests for NutriScore Engine (Properties 4, 5, 6)
    - **Property 4: NutriScore Scoring Invariants** — For all valid inputs, negative_points ∈ [0,40], positive_points ∈ [0,15], net_score = negative − positive, net_score ∈ [-15,40]
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.10**
    - **Property 5: Grade Assignment Correctness** — Grade is exactly determined by net_score and category thresholds
    - **Validates: Requirements 5.6, 5.7**
    - **Property 6: Input Validation Rejects Invalid Data** — Negative values or sat_fat > total_fat always rejected with error
    - **Validates: Requirements 16.3, 16.4**
    - Create `tests/unit/nutriscoreEngine.property.test.js` using fast-check with 100+ iterations per property

  - [ ]* 1.3 Write unit tests for NutriScore Engine
    - Create `tests/unit/nutriscoreEngine.test.js` with known food examples (apple=A, cola=E, cheese=D)
    - Test boundary values at each grade transition
    - Test null handling for optional fields (fibre, protein, FVN)
    - Test category-specific behaviour (beverages, cheese, fats_and_oils)
    - _Requirements: 5.1, 5.4, 5.9_

- [x] 2. Implement NOVA Classifier (pure function)
  - [x] 2.1 Create `services/novaClassifier.js` with marker dictionaries and `classifyNOVA` function
    - Define GROUP_4_MARKERS regex array (E-numbers, flavours, colours, emulsifiers, stabilisers, sweeteners, hydrogenated oils, HFCS, protein isolates, MSG, maltodextrin)
    - Define GROUP_2_MARKERS regex array (salt, sugar, oil, butter, flour, honey, vinegar, spices)
    - Define SYNONYMS dictionary (MSG↔monosodium glutamate, HFCS↔high-fructose corn syrup, INS→E-number)
    - Implement `normaliseSynonyms` function for case-insensitive matching and synonym resolution
    - Implement classification logic: Group 4 (any ultra-processing marker) → Group 3 (≥2 ingredients combining Group 1+2) → Group 2 (single culinary ingredient) → Group 1 (default)
    - Return `{ group, reason, matched_markers }` structure
    - Return null with reason when ingredients array is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ]* 2.2 Write property tests for NOVA Classifier (Properties 7, 8, 9)
    - **Property 7: NOVA Highest-Group Precedence** — Any list with a Group 4 marker always classifies as Group 4
    - **Validates: Requirements 6.2, 6.6**
    - **Property 8: NOVA Classification Invariant** — All non-empty lists produce exactly one of 1, 2, 3, or 4
    - **Validates: Requirements 6.10**
    - **Property 9: NOVA Case-Insensitive Synonym Matching** — Case variants and synonyms produce same classification
    - **Validates: Requirements 6.9**
    - Create `tests/unit/novaClassifier.property.test.js` using fast-check with 100+ iterations per property

  - [ ]* 2.3 Write unit tests for NOVA Classifier
    - Create `tests/unit/novaClassifier.test.js` with known products (rice=1, sugar=2, canned fish=3, instant noodles=4)
    - Test synonym matching (MSG, HFCS, INS numbers)
    - Test empty ingredients returns null
    - Test performance: classification completes within 50ms
    - _Requirements: 6.1, 6.7, 6.9_

- [x] 3. Implement OCR Extractor (parsing and normalisation)
  - [x] 3.1 Create `services/ocrExtractor.js` with `parseAndNormalise` function
    - Implement NutritionPer100g parsing from Vision API extraction result
    - Implement ServingInfo parsing (value, unit, servings_per_container)
    - Implement `convertToPerHundredGrams` for per-serving to per-100g conversion
    - Implement ingredients_raw → ingredients_parsed splitting (comma/semicolon delimiter, trim, preserve order)
    - Implement missing_fields detection for null required fields
    - Handle FSSAI-specific fields mapping (trans_fat, cholesterol, added_sugars)
    - Prefer per-100g column when both per-serving and per-100g are available
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.2, 14.3_

  - [ ]* 3.2 Write property tests for OCR Extractor (Properties 1, 2)
    - **Property 1: Nutrition Data Serialisation Round-Trip** — Serialise to JSON string and deserialise back produces numerically equivalent object (within 0.01 tolerance)
    - **Validates: Requirements 4.6, 16.2**
    - **Property 2: Per-Serving to Per-100g Conversion Correctness** — V × 100 / S computed correctly and reverse conversion recovers original
    - **Validates: Requirements 4.1, 4.4**
    - Create `tests/unit/ocrExtractor.property.test.js` using fast-check with 100+ iterations per property

  - [ ]* 3.3 Write unit tests for OCR Extractor
    - Create `tests/unit/ocrExtractor.test.js` with fixture extraction results
    - Test per-serving conversion with various serving sizes
    - Test FSSAI field mapping
    - Test ingredient list parsing with various delimiters
    - Test missing field detection
    - _Requirements: 4.2, 4.5, 14.2_

- [x] 4. Checkpoint - Core scoring engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Image Upload Module (Cloudflare R2)
  - [x] 5.1 Create `services/imageUpload.js` with R2 integration via `@aws-sdk/client-s3`
    - Install `@aws-sdk/client-s3` and `uuid` dependencies
    - Configure S3Client with R2 endpoint using env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)
    - Implement `uploadImages(files)` function that uploads concurrently using Promise.all
    - Generate unique object keys using uuid for each image
    - Return array of `{ url, key, size, contentType }` objects
    - Handle upload failures with appropriate error propagation
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 5.2 Write unit tests for Image Upload Module
    - Create `tests/unit/imageUpload.test.js` with mocked S3Client
    - Test concurrent upload of multiple files
    - Test error handling when PutObject fails
    - Test unique key generation
    - _Requirements: 2.1, 2.5_

- [x] 6. Implement Vision Service (Claude Vision API)
  - [x] 6.1 Create `services/visionService.js` with Claude Vision API integration
    - Install `@anthropic-ai/sdk` dependency
    - Implement structured extraction prompt (product name, brand, serving size, nutrition values, ingredients)
    - Include FSSAI/Hindi-English bilingual extraction instructions in prompt
    - Implement `extractFromImages(imageUrls)` that sends images concurrently to Claude Vision API
    - Implement multi-image merge logic: prefer highest confidence value per field
    - Assign extraction_confidence and field_confidences scores
    - Implement 6-second timeout per image with retry once on 5xx
    - Handle API unreachable with appropriate error (503)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1, 14.4_

  - [ ]* 6.2 Write property test for Vision Service merge logic (Property 3)
    - **Property 3: Multi-Image Extraction Merge Prefers Highest Confidence** — For conflicting fields, merged result uses value from highest confidence extraction
    - **Validates: Requirements 3.3**
    - Create `tests/unit/visionService.property.test.js` using fast-check with 100+ iterations

  - [ ]* 6.3 Write unit tests for Vision Service
    - Create `tests/unit/visionService.test.js` with mocked Anthropic SDK
    - Test single image extraction with structured response
    - Test multi-image merge logic
    - Test low confidence threshold warning (< 0.3)
    - Test timeout and retry behaviour
    - Test 503 error propagation
    - _Requirements: 3.5, 3.6, 3.7_

- [x] 7. Implement MongoDB Schemas and Indexes
  - [x] 7.1 Create MongoDB models and indexes for scans and products collections
    - Create `models/scan.js` with Scan_Record schema (scan_id, product_id, user_id, version, image_refs, raw_ocr_text, nutrition_per_100g, serving_info, ingredients_raw, ingredients_parsed, nutri_score, nova_group, extraction_confidence, field_confidences, missing_fields, warnings, category, correction_log, created_at, updated_at)
    - Create `models/product.js` with Product_Record schema (product_id, name, brand, barcode, category, latest_scan_id, scan_count, created_at, updated_at)
    - Define indexes: scans (scan_id unique, product_id+version, user_id+created_at, created_at)
    - Define indexes: products (product_id unique, text index on name+brand+barcode, nutri_score.grade, nova_group.group, barcode sparse)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1_

- [x] 8. Implement API Routes and Scan Pipeline
  - [x] 8.1 Create `routes/labelScanner.js` with POST /api/v1/scans endpoint
    - Install `multer` dependency and configure for multipart image upload (max 3 files, 10MB each)
    - Validate JWT Bearer token via existing auth middleware
    - Validate request: reject if no images, unsupported formats, or oversized files
    - Wire full pipeline: upload images → vision extraction → OCR parsing → NutriScore computation → NOVA classification → persist Scan_Record and upsert Product_Record
    - Handle existing product matching by barcode or name+brand, increment version
    - Create new Product_Record when no match found
    - Return 201 JSON response with full scan data structure
    - Include warnings array for low confidence fields and missing data
    - Generate request_id (uuid) for all error responses
    - Implement input sanitisation for user-provided fields
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 11.1, 11.2, 11.4, 11.5, 12.1, 13.4_

  - [x] 8.2 Implement GET /api/v1/scans/:id endpoint
    - Return full Scan_Record for specified scan_id
    - Return 404 with request_id when scan not found
    - Require valid JWT Bearer token
    - _Requirements: 9.4, 11.2, 11.4_

  - [x] 8.3 Implement PATCH /api/v1/scans/:id correction endpoint
    - Accept corrected field values in request body
    - Create new Scan_Version with corrections applied and incremented version number
    - Recompute NutriScore with corrected nutritional values
    - Reclassify NOVA Group with corrected ingredients
    - Store correction_log entry (corrected fields, previous values, new values, user_id, timestamp)
    - Update Product_Record's latest_scan_id to new version
    - Return updated scan data with recalculated scores
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 8.4 Implement GET /api/v1/products and GET /api/v1/products/:id endpoints
    - Implement product search with `q` parameter (case-insensitive partial matching on name, brand, barcode)
    - Implement `nutri_score` and `nova_group` filter parameters
    - Implement pagination with `page` and `limit` parameters (default 20, max 100)
    - GET /api/v1/products/:id returns full Product_Record with latest Scan_Record data
    - Return 404 with request_id when product not found
    - Require valid JWT Bearer token
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.2, 11.4_

  - [x] 8.5 Register label scanner routes in `server.js`
    - Import and mount `routes/labelScanner.js` under `/api/v1/` prefix in existing server.js
    - Add error middleware for standardised error response format with request_id
    - Ensure stateless request processing (no server-side sessions)
    - _Requirements: 11.1, 11.3, 11.5_

- [x] 9. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Mobile Label Scanner Screen
  - [x] 10.1 Create `LabelScannerScreen` component with camera and gallery support
    - Install `expo-image-picker` dependency
    - Request camera permission on screen navigation, show settings redirect message if denied
    - Display camera viewfinder with rectangular overlay guide for label framing
    - Implement capture button to take JPEG photo (minimum 1280x720)
    - Implement gallery button for photo library selection
    - Accept JPEG, PNG, WEBP, HEIC formats
    - Reject images > 10MB with error message
    - Display thumbnails of selected images (up to 3) with remove buttons
    - Display "Scan Label" submission button when images are selected
    - Upload images as multipart form data to POST /api/v1/scans via API_Client
    - Show loading indicator ("Analysing label…") with 15-second timeout
    - Handle network errors and timeouts with retry button (retain selected images)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 15.2_

  - [x] 10.2 Create `LabelResultScreen` component with score display
    - Display product name, brand, Nutrition_Per_100g values, Serving_Info, ingredient list
    - Display Nutri-Score badge as letter (A–E) with grade-specific background colour and white bold text
    - Display NOVA Group as numeric value (1–4) with descriptive labels (Unprocessed, Culinary Ingredient, Processed, Ultra-processed)
    - Highlight fields with extraction_confidence < 0.5 using amber warning indicator and Edit button
    - Implement inline editor for low-confidence fields
    - Display "Correct Data" button for manual corrections via PATCH /api/v1/scans/:id
    - Update displayed scores after correction response
    - Display "Not available" with tooltip when nutri_score or nova_group is null
    - Handle API error responses with error message and Retry button
    - _Requirements: 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [x] 10.3 Integrate "Scan Label" button into existing ScannerScreen
    - Add persistently visible "Scan Label" button alongside barcode scanning controls
    - Navigate to LabelScannerScreen on tap
    - _Requirements: 15.1_

- [ ] 11. Write integration tests for scan pipeline
  - [ ]* 11.1 Write integration tests for full scan pipeline
    - Create `tests/integration/scanPipeline.test.js`
    - Test full pipeline with mocked Claude Vision API: upload → extract → parse → score → persist → response
    - Test concurrent multi-image processing
    - Test 400 for no images or unsupported formats
    - Test 413 for oversized images
    - Test 503 when Vision API unavailable
    - _Requirements: 8.1, 8.3, 8.4, 12.1, 12.3_

  - [ ]* 11.2 Write integration tests for corrections and search
    - Create `tests/integration/corrections.test.js` — Test PATCH creates new version, re-scores, updates product pointer
    - Create `tests/integration/search.test.js` — Test product search with q parameter, filters, pagination
    - **Property 10: Search Filter Correctness** — All returned products match filter constraints
    - **Validates: Requirements 9.2**
    - **Property 11: Pagination Invariant** — Results ≤ limit and represent correct positional slice
    - **Validates: Requirements 9.5**
    - **Property 12: Scan Version Immutability** — All versions retrievable, latest_scan_id always points to newest
    - **Validates: Requirements 7.4, 7.5**
    - _Requirements: 9.2, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 11.3 Write auth middleware integration tests
    - Create `tests/integration/auth.test.js`
    - Test 401 for missing JWT, expired token, invalid token
    - Test successful auth passes user_id to handler
    - _Requirements: 11.2_

- [x] 12. Final checkpoint - All components integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (12 properties total)
- Unit tests validate specific examples and edge cases
- The scoring engines (NutriScore, NOVA) are built first as pure functions to enable early validation
- All backend services are implemented as JavaScript modules in the existing Node.js monolith
- Mobile screens use React Native/Expo with the existing API client (Bearer token interceptor)
- Environment variables for R2 and Anthropic API must be configured before testing infrastructure layers

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "3.2", "3.3"] },
    { "id": 2, "tasks": ["5.1", "7.1"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.4"] },
    { "id": 6, "tasks": ["8.3", "8.5"] },
    { "id": 7, "tasks": ["10.1", "10.2"] },
    { "id": 8, "tasks": ["10.3"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
