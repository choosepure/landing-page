# Requirements Document

## Introduction

ChoosePure is India's first independent food purity testing platform. The existing React Native (Expo) mobile app provides barcode scanning via the ScannerScreen, which detects EAN-13 barcodes and fetches product data from Open Food Facts. The backend is a Node.js/Express server connected to MongoDB Atlas with existing collections for products, test reports, and curated products.

This feature extends the platform with a Food Label Scanner that accepts images of food product labels (nutrition facts panels, ingredient lists, front-of-pack labels) and automatically extracts nutritional data using vision AI (Claude Vision API). The extracted data is used to compute Nutri-Score (A–E) using the 2021 FSA/Santé Publique France algorithm and classify NOVA Group (1–4) based on ingredient analysis. All structured product data is persisted to MongoDB for querying, tracking, and analysis. The feature exposes a REST API consumable by the mobile app and web clients, and integrates with the existing scanner flow as an alternative input method when barcodes are unavailable or unreadable.

## Glossary

- **Label_Scanner_Screen**: The mobile app screen where users capture or select food label images for scanning
- **Vision_Service**: The backend module that sends label images to the Claude Vision API and receives structured text extraction
- **OCR_Extractor**: The component within Vision_Service that parses raw vision output into structured nutritional fields
- **NutriScore_Engine**: A pure function module that computes Nutri-Score grade (A–E) from structured nutritional data using the 2021 FSA algorithm
- **NOVA_Classifier**: A pure function module that classifies NOVA Group (1–4) from a parsed ingredient list using additive and ultra-processing markers
- **Scan_Record**: A MongoDB document in the `scans` collection containing extracted data, computed scores, raw OCR text, image references, confidence scores, and version history
- **Product_Record**: A MongoDB document in the `products` collection linking a product identity (name, brand, barcode) to its latest scan
- **Image_Store**: Object storage (cloud bucket) where uploaded label images are persisted and referenced by URL
- **Correction_Endpoint**: The PATCH API endpoint that accepts manual corrections to extracted fields and triggers score re-computation
- **Extraction_Confidence**: A numeric score (0.0–1.0) indicating the Vision_Service's confidence in the accuracy of extracted text
- **Serving_Info**: Structured data containing serving size value, serving size unit, and servings per container
- **Nutrition_Per_100g**: A standardised object containing energy (kcal), total fat, saturated fat, carbohydrates, sugars, fibre, protein, and sodium values per 100 grams
- **Ingredients_Parsed**: An array of individual ingredient objects extracted from the raw ingredient list text
- **Scan_Version**: An immutable snapshot of a scan's extracted data and scores, retained for audit trail purposes
- **API_Gateway**: The existing Node.js/Express backend server at `server.js`
- **Mobile_App**: The existing React Native (Expo) mobile application
- **API_Client**: The existing Axios HTTP client module at `src/api/client.js` with Bearer token interceptor

## Requirements

### Requirement 1: Label Image Capture and Upload

**User Story:** As a mobile user, I want to capture or select images of food product labels, so that I can get nutritional analysis without needing a readable barcode.

#### Acceptance Criteria

1. WHEN the user navigates to the Label_Scanner_Screen, THE Mobile_App SHALL request camera permission from the device operating system
2. IF camera permission is denied, THEN THE Label_Scanner_Screen SHALL display a message indicating that camera access is required and provide a button to open the device settings screen, while still allowing access to the gallery button for image selection
3. WHEN camera permission is granted, THE Label_Scanner_Screen SHALL display a camera viewfinder with a rectangular overlay guide sized to frame a standard food label
4. WHEN the user taps the capture button, THE Label_Scanner_Screen SHALL capture the current camera frame as a JPEG image with a minimum resolution of 1280x720 pixels
5. THE Label_Scanner_Screen SHALL provide a gallery button that allows the user to select existing images from the device photo library
6. THE Label_Scanner_Screen SHALL accept images in JPEG, PNG, WEBP, and HEIC formats
7. IF the user selects or captures an image larger than 10 MB, THEN THE Label_Scanner_Screen SHALL reject the image and display an error message indicating the image exceeds the 10 MB size limit
8. WHEN the user has captured or selected one or more images (up to 3), THE Label_Scanner_Screen SHALL display thumbnails of selected images with a remove button on each thumbnail, and a "Scan Label" submission button
9. WHEN the user taps "Scan Label", THE API_Client SHALL upload the images as multipart form data to `POST /api/v1/scans` and THE Label_Scanner_Screen SHALL display a loading indicator until a response is received or 15 seconds elapse
10. IF the image upload fails due to a network error or the 15-second timeout elapses without a response, THEN THE Label_Scanner_Screen SHALL display an error message indicating the upload failed and allow the user to retry without re-selecting images

### Requirement 2: Image Storage and Reference

**User Story:** As a system operator, I want uploaded label images to be stored durably, so that they can be referenced for audit, correction, and reprocessing.

#### Acceptance Criteria

1. WHEN the API_Gateway receives images via `POST /api/v1/scans`, THE API_Gateway SHALL upload each image to the Image_Store
2. THE Image_Store SHALL generate a unique reference URL for each uploaded image
3. THE API_Gateway SHALL store the image reference URLs in the Scan_Record's `image_refs` array field
4. THE Image_Store SHALL retain uploaded images for a minimum of 12 months
5. IF an image upload to the Image_Store fails, THEN THE API_Gateway SHALL return a 500 error with the message "Image storage failed. Please try again."

### Requirement 3: Vision AI Text Extraction

**User Story:** As a user, I want the system to automatically read text from my food label images, so that I do not have to manually type nutritional information.

#### Acceptance Criteria

1. WHEN images are successfully stored, THE Vision_Service SHALL send each image to the Claude Vision API with a structured extraction prompt requesting product name, brand, serving size, nutritional values, and ingredient list
2. THE Vision_Service SHALL extract the following fields from label images: product name, brand, serving size (value and unit), energy (kcal and kJ), total fat, saturated fat, total carbohydrates, sugars, dietary fibre, protein, sodium, and the full ingredient list text
3. WHEN multiple images are provided for a single scan, THE Vision_Service SHALL merge extracted data from all images, preferring data from the image with highest Extraction_Confidence for conflicting fields
4. THE Vision_Service SHALL assign an Extraction_Confidence score (0.0–1.0) to each extracted field
5. WHEN the Vision_Service cannot extract any meaningful text from an image, THE Vision_Service SHALL return an overall Extraction_Confidence below 0.3 and THE API_Gateway SHALL include a warning in the response stating "Low confidence extraction. Please verify the results."
6. THE Vision_Service SHALL complete text extraction within 6 seconds per image (p95)
7. IF the Claude Vision API is unreachable or returns an error, THEN THE API_Gateway SHALL return a 503 error with the message "Vision service temporarily unavailable. Please try again later."

### Requirement 4: Nutritional Data Parsing and Structuring

**User Story:** As a user, I want extracted text to be converted into structured nutritional data, so that scores can be computed and data can be compared across products.

#### Acceptance Criteria

1. WHEN the Vision_Service returns raw extracted text, THE OCR_Extractor SHALL parse numerical nutritional values and normalise them to per-100g units stored as Nutrition_Per_100g
2. THE OCR_Extractor SHALL parse the serving size into a Serving_Info object containing numeric value, unit (g, ml, or piece), and servings per container when available
3. THE OCR_Extractor SHALL parse the raw ingredient list text into an Ingredients_Parsed array of individual ingredient strings, preserving the order as listed on the label
4. WHEN a nutritional value is provided only per-serving (not per-100g), THE OCR_Extractor SHALL compute the per-100g value using the serving size
5. IF the OCR_Extractor cannot parse a required nutritional field, THEN THE OCR_Extractor SHALL set that field to null and flag it in a `missing_fields` array in the Scan_Record
6. FOR ALL valid Nutrition_Per_100g objects, formatting to display text and then parsing back SHALL produce a numerically equivalent object (round-trip property)

### Requirement 5: Nutri-Score Computation

**User Story:** As a user, I want to see a Nutri-Score grade for the scanned product, so that I can quickly assess its overall nutritional quality.

#### Acceptance Criteria

1. WHEN a Scan_Record is created or updated with non-null values for energy, saturated fat, sugars, and sodium in Nutrition_Per_100g, THE NutriScore_Engine SHALL compute the Nutri-Score grade using those values expressed in kcal (energy), grams (saturated fat, sugars), and milligrams (sodium)
2. THE NutriScore_Engine SHALL compute negative points (0–40) from: energy (0–10), saturated fat (0–10), sugars (0–10), and sodium (0–10) using the 2021 FSA thresholds
3. THE NutriScore_Engine SHALL compute positive points (0–15) from: fibre (0–5), protein (0–5), and fruits/vegetables/nuts percentage (0–5) using the 2021 FSA thresholds
4. IF fibre, protein, or fruits/vegetables/nuts percentage fields are null in Nutrition_Per_100g, THEN THE NutriScore_Engine SHALL treat each null field as contributing 0 points to the positive points total
5. THE NutriScore_Engine SHALL compute the net score as negative points minus positive points
6. THE NutriScore_Engine SHALL assign grades for solid food products based on net score: A for score at or below -1, B for score 0 to 2, C for score 3 to 10, D for score 11 to 18, E for score 19 or above
7. WHEN the product category is "beverages", THE NutriScore_Engine SHALL apply the beverage-specific thresholds for energy and sugars and assign beverage grades based on net score: A for score at or below 1, B for score 2 to 5, C for score 6 to 9, D for score 10 to 13, E for score 14 or above, as defined by the 2021 FSA algorithm
8. WHEN the product category is "cheese" or "fats and oils", THE NutriScore_Engine SHALL apply the category-specific rules for protein points as defined by the 2021 FSA algorithm
9. IF required nutritional fields (energy, saturated fat, sugars, or sodium) are null, THEN THE NutriScore_Engine SHALL return a null grade and include the reason "Insufficient data for Nutri-Score computation" in the Scan_Record
10. FOR ALL valid Nutrition_Per_100g inputs, THE NutriScore_Engine SHALL produce a net score that is an integer between -15 and 40 (invariant property)

### Requirement 6: NOVA Group Classification

**User Story:** As a user, I want to see a NOVA classification for the scanned product, so that I can understand the degree of processing in the food.

#### Acceptance Criteria

1. WHEN a Scan_Record has a non-empty Ingredients_Parsed array, THE NOVA_Classifier SHALL classify the product into a NOVA Group (1, 2, 3, or 4) within 50 milliseconds
2. IF any ingredient in the Ingredients_Parsed array matches an entry in the NOVA_Classifier's Group 4 marker list (flavours, colours, emulsifiers, stabilisers, artificial sweeteners, hydrogenated oils, or E-number additives categorised as ultra-processing markers) using case-insensitive substring matching, THEN THE NOVA_Classifier SHALL classify the product as Group 4 (ultra-processed)
3. IF no Group 4 markers are detected AND the Ingredients_Parsed array contains 2 or more ingredients combining Group 1 foods with Group 2 substances (salt, sugar, oil, vinegar, or other single-substance culinary ingredients) and no other additive types, THEN THE NOVA_Classifier SHALL classify the product as Group 3 (processed)
4. IF no Group 4 markers are detected AND the Ingredients_Parsed array contains exactly 1 ingredient that is a culinary substance derived from Group 1 foods (salt, sugar, oils, butter, flour, honey, vinegar, or spices), THEN THE NOVA_Classifier SHALL classify the product as Group 2 (processed culinary ingredient)
5. IF no Group 4 markers are detected AND the Ingredients_Parsed array contains only whole foods or foods altered solely by removal of inedible parts, drying, crushing, grinding, fractioning, filtering, roasting, boiling, pasteurisation, refrigeration, freezing, or fermentation with no added substances, THEN THE NOVA_Classifier SHALL classify the product as Group 1 (unprocessed or minimally processed)
6. WHEN multiple NOVA group markers are present in the Ingredients_Parsed array, THE NOVA_Classifier SHALL assign the highest applicable group number (most processed classification takes precedence)
7. IF the Ingredients_Parsed array is empty, THEN THE NOVA_Classifier SHALL return a null classification and include the reason "No ingredients available for NOVA classification" in the Scan_Record
8. IF the Ingredients_Parsed array is non-empty but no ingredient matches any defined marker in Groups 2, 3, or 4, THEN THE NOVA_Classifier SHALL classify the product as Group 1 by default
9. THE NOVA_Classifier SHALL perform ingredient matching using case-insensitive comparison and shall recognise common synonyms (e.g., "MSG" and "monosodium glutamate", "high-fructose corn syrup" and "HFCS") as equivalent entries from its marker lists
10. FOR ALL non-empty ingredient lists, THE NOVA_Classifier SHALL produce a classification that is an integer value of 1, 2, 3, or 4 (invariant property)

### Requirement 7: Scan Data Persistence and Versioning

**User Story:** As a system operator, I want all scan data to be stored with version history, so that corrections and re-scans create a traceable audit trail.

#### Acceptance Criteria

1. WHEN a scan completes successfully, THE API_Gateway SHALL create a Scan_Record in the `scans` collection containing: scan_id, product_id, version number, image_refs, raw_ocr_text, Nutrition_Per_100g, Serving_Info, ingredients_raw, Ingredients_Parsed, nutri_score (grade and net score), nova_group, Extraction_Confidence, and created_at timestamp
2. WHEN a scan matches an existing Product_Record (by barcode or product name and brand), THE API_Gateway SHALL increment the version number and link the new Scan_Record to the existing product
3. WHEN a scan does not match any existing Product_Record, THE API_Gateway SHALL create a new Product_Record in the `products` collection with: product_id, name, brand, barcode (if available), category, and latest_scan_id
4. THE API_Gateway SHALL retain all previous Scan_Version documents and never overwrite or delete them
5. THE Product_Record SHALL maintain a `latest_scan_id` field pointing to the most recent Scan_Record for that product

### Requirement 8: Structured JSON API Response

**User Story:** As a mobile/web developer, I want the scan endpoint to return a structured JSON response, so that I can display results in the client application.

#### Acceptance Criteria

1. WHEN a scan completes successfully, THE API_Gateway SHALL return a 201 response with a JSON body containing: scan_id, product_id, product name, brand, serving_info, nutrition_per_100g, ingredients_raw, ingredients_parsed, nutri_score (grade and net_score), nova_group, extraction_confidence, image_refs, warnings (array), and created_at
2. WHEN extraction produces warnings (low confidence fields, missing data), THE API_Gateway SHALL include them in the `warnings` array of the response
3. THE API_Gateway SHALL return a 400 response when the request contains no images or images in unsupported formats
4. THE API_Gateway SHALL return a 413 response when any single image exceeds 10 MB

### Requirement 9: Product Search and Retrieval

**User Story:** As a user, I want to search for previously scanned products by name, brand, or barcode, so that I can revisit product data without rescanning.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/v1/products` with a `q` query parameter, THE API_Gateway SHALL search Product_Records by product name, brand, and barcode using case-insensitive partial matching
2. WHEN a GET request is made to `/api/v1/products` with `nutri_score` or `nova_group` filter parameters, THE API_Gateway SHALL return only products matching the specified grade or group
3. WHEN a GET request is made to `/api/v1/products/:id`, THE API_Gateway SHALL return the full Product_Record including the data from the latest Scan_Record
4. WHEN a GET request is made to `/api/v1/scans/:id`, THE API_Gateway SHALL return the full Scan_Record for the specified scan
5. THE API_Gateway SHALL support pagination on `/api/v1/products` using `page` and `limit` query parameters with a default limit of 20 and a maximum limit of 100

### Requirement 10: Manual Correction and Re-Scoring

**User Story:** As a user, I want to correct extracted data if the OCR made mistakes, so that the computed scores accurately reflect the actual label.

#### Acceptance Criteria

1. WHEN a PATCH request is made to `/api/v1/scans/:id` with corrected field values, THE API_Gateway SHALL create a new Scan_Version with the corrections applied and an incremented version number
2. WHEN corrected nutritional values are saved, THE NutriScore_Engine SHALL recompute the Nutri-Score grade using the corrected values
3. WHEN corrected ingredient data is saved, THE NOVA_Classifier SHALL reclassify the NOVA Group using the corrected ingredients
4. THE API_Gateway SHALL store a `correction_log` entry in the Scan_Record containing: corrected fields, previous values, new values, user_id, and correction timestamp
5. THE API_Gateway SHALL update the Product_Record's `latest_scan_id` to point to the newly created corrected Scan_Version

### Requirement 11: REST API Design and Scalability

**User Story:** As a platform operator, I want the API to be stateless and well-structured, so that it can be horizontally scaled and consumed by multiple client types.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose all label scanner endpoints under the `/api/v1/` path prefix
2. THE API_Gateway SHALL require a valid JWT Bearer token for all `/api/v1/scans` and `/api/v1/products` endpoints
3. THE API_Gateway SHALL process requests statelessly with no server-side session storage
4. THE API_Gateway SHALL return appropriate HTTP status codes: 201 for successful scan creation, 200 for successful retrieval, 400 for invalid requests, 401 for missing or invalid authentication, 404 for resources not found, 413 for oversized payloads, 503 for service unavailability
5. THE API_Gateway SHALL include a `request_id` field in all error responses to support debugging and tracing

### Requirement 12: Performance and Pipeline Latency

**User Story:** As a user, I want scan results to appear quickly after uploading label images, so that the experience feels responsive.

#### Acceptance Criteria

1. THE API_Gateway SHALL complete the full image-to-score pipeline (upload, vision extraction, parsing, scoring, persistence, response) within 8 seconds at the 95th percentile
2. THE Vision_Service SHALL process each individual image within 6 seconds at the 95th percentile
3. WHEN multiple images are uploaded for a single scan, THE Vision_Service SHALL process them concurrently to minimise total pipeline latency
4. THE NutriScore_Engine SHALL compute a score within 10 milliseconds for any valid Nutrition_Per_100g input
5. THE NOVA_Classifier SHALL classify a product within 50 milliseconds for any valid Ingredients_Parsed input

### Requirement 13: Data Security and Encryption

**User Story:** As a platform operator, I want product data encrypted at rest, so that sensitive scan data is protected from unauthorized access.

#### Acceptance Criteria

1. THE API_Gateway SHALL store all Scan_Records and Product_Records in a MongoDB Atlas cluster with encryption at rest enabled
2. THE Image_Store SHALL encrypt stored images at rest using server-side encryption
3. THE API_Gateway SHALL transmit all data over HTTPS (TLS 1.2 or higher)
4. THE API_Gateway SHALL sanitise all user-provided input fields before database insertion to prevent injection attacks

### Requirement 14: FSSAI Nutrient Field Support

**User Story:** As an Indian user, I want the scanner to recognise FSSAI-format nutrition labels, so that Indian food products are correctly parsed.

#### Acceptance Criteria

1. THE Vision_Service SHALL recognise and extract nutritional data from FSSAI-format nutrition panels (which list energy in kcal, and may include trans fat, cholesterol, and added sugars as separate line items)
2. THE OCR_Extractor SHALL map FSSAI-specific fields (trans fat, cholesterol, added sugars) to their corresponding positions in the Nutrition_Per_100g object
3. WHEN a label contains both per-serving and per-100g columns (common in FSSAI format), THE OCR_Extractor SHALL prefer the per-100g column values
4. THE Vision_Service SHALL handle labels in English and Hindi bilingual formats by extracting the English text values

### Requirement 15: Mobile App Integration

**User Story:** As a mobile user, I want to access the label scanner from within the existing scanner flow, so that I can choose between barcode scanning and label scanning seamlessly.

#### Acceptance Criteria

1. THE Scanner_Screen SHALL display a "Scan Label" button that is persistently visible alongside the barcode scanning controls and navigates to the Label_Scanner_Screen when the user taps it
2. WHEN the user taps "Scan Label" on the Label_Scanner_Screen and images are uploading, THE Mobile_App SHALL display a loading indicator with the text "Analysing label…" until the API response is received or a timeout of 15 seconds is reached
3. WHEN a label scan completes successfully, THE Mobile_App SHALL navigate to a Label_Result_Screen displaying product name, brand, Nutrition_Per_100g values, Serving_Info, ingredient list, Nutri-Score badge, and NOVA Group classification
4. THE Label_Result_Screen SHALL display the Nutri-Score badge as a letter (A through E) with a grade-specific background colour and white bold text
5. THE Label_Result_Screen SHALL display the NOVA Group as a numeric value (1–4) with descriptive labels: 1 "Unprocessed", 2 "Culinary Ingredient", 3 "Processed", 4 "Ultra-processed"
6. WHEN extracted fields have Extraction_Confidence below 0.5, THE Label_Result_Screen SHALL highlight those fields with an amber warning indicator and an "Edit" button that opens an inline editor for that field
7. THE Label_Result_Screen SHALL display a "Correct Data" button that allows the user to edit any extracted field, submit corrections via the Correction_Endpoint, and display the updated Nutri-Score and NOVA Group upon receiving the re-scored response
8. IF the scan API returns an error response, THEN THE Mobile_App SHALL dismiss the loading indicator and display the error message returned by the API_Gateway, with a "Retry" button to re-submit the scan
9. IF the Nutri-Score grade or NOVA Group is null in the API response, THEN THE Label_Result_Screen SHALL display "Not available" in place of the score with a tooltip indicating the reason provided in the API response warnings array

### Requirement 16: Nutri-Score Serialisation

**User Story:** As a developer, I want Nutri-Score inputs and outputs to be reliably serialised for storage and API transmission, so that data integrity is maintained across the pipeline.

#### Acceptance Criteria

1. THE NutriScore_Engine SHALL accept Nutrition_Per_100g input as a JSON object and produce a score result as a JSON object containing `grade` (string) and `net_score` (integer)
2. FOR ALL valid Nutrition_Per_100g JSON objects, serialising to a JSON string and deserialising back SHALL produce a numerically equivalent object (round-trip property)
3. THE NutriScore_Engine SHALL reject Nutrition_Per_100g objects containing negative numeric values for any nutritional field and return an error indicating the invalid field
4. THE NutriScore_Engine SHALL reject Nutrition_Per_100g objects where saturated fat exceeds total fat and return an error indicating the logical inconsistency
