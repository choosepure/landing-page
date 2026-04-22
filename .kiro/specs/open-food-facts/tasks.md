# Implementation Plan: Open Food Facts Integration

## Overview

This plan implements the Open Food Facts (OFF) integration for ChoosePure in five phases: backend cache + proxy, admin barcode field, Product Lookup page, Purity Wall enhancements, and Deep Dive enrichment. Each task builds incrementally on the previous, ending with full wiring and integration.

## Tasks

- [x] 1. Implement OFF cache module and proxy endpoints in server.js
  - [x] 1.1 Add the OFF in-memory cache module at the top of server.js
    - Create the `offCache` Map, `OFF_CACHE_TTL` constant (24h), `offCacheGet(key)`, and `offCacheSet(key, data)` functions
    - Implement timestamp-based expiry check in `offCacheGet`
    - Cache `{ found: false }` responses with the same 24h TTL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 1.2 Add the `normaliseProduct()` helper function
    - Extract and map fields from raw OFF API response: name, brand, barcode, nutriScore, novaGroup, ingredients, additives (with E-number, name, risk), allergens, nutritionPer100g, ecoScore, imageUrl
    - Map additive risk levels from OFF `additives_tags` and `knowledge_panels` or `additives_old_tags` data
    - Return null-safe defaults for missing fields
    - _Requirements: 1.3_

  - [x] 1.3 Add the `normaliseSearchResults()` helper function
    - Map each product in the OFF search response array to: name, brand, barcode, nutriScore, novaGroup, imageUrl
    - Limit output array to a maximum of 24 items
    - _Requirements: 2.2, 2.3_

  - [x] 1.4 Add the `isValidBarcode()` validation function
    - Validate input matches `/^\d{13}$/`
    - Return boolean
    - _Requirements: 1.7, 12.4_

  - [x] 1.5 Implement `GET /api/off/product/:barcode` route
    - Validate barcode with `isValidBarcode()`; return 400 if invalid
    - Check `offCacheGet('product:' + barcode)`; return cached data on hit
    - On cache miss, fetch from `https://world.openfoodfacts.org/api/v2/product/{barcode}.json` with 3s `AbortController` timeout and `User-Agent: ChoosePure/1.0 (choosepure.in)`
    - On OFF product found: normalise with `normaliseProduct()`, cache with `offCacheSet()`, return `{ found: true, product: {...} }`
    - On OFF product not found: cache and return `{ found: false }`
    - On timeout: return 504 with error message
    - On OFF non-200: return 502 with error message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3, 3.6_

  - [x] 1.6 Implement `GET /api/off/search` route
    - Validate `q` query parameter exists and is at least 2 characters; return 400 if missing or too short
    - Normalise cache key: `search:` + trimmed, lowercased query
    - Check cache; return cached data on hit
    - On cache miss, fetch from `https://world.openfoodfacts.org/cgi/search.pl?search_terms={q}&json=1&page_size=24` with 3s timeout and User-Agent header
    - Normalise results with `normaliseSearchResults()`, cache, and return `{ products: [...] }`
    - On timeout: return 504; on OFF non-200: return 502
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.4_

  - [x] 1.7 Add the `/product-lookup` route to serve the new page
    - Add `app.get('/product-lookup', ...)` that sends `product-lookup.html`
    - _Requirements: 4.1_

  - [ ]* 1.8 Write property tests for cache and normalisation functions
    - **Property 1: Barcode lookup normalisation** — generate random OFF API response objects, verify `normaliseProduct()` returns all required fields correctly mapped
    - **Property 2: Invalid barcode rejection** — generate random non-barcode strings, verify `isValidBarcode()` returns false
    - **Property 3: Search result normalisation** — generate random OFF search arrays, verify `normaliseSearchResults()` output has correct fields and length ≤ 24
    - **Property 4: Cache round-trip** — generate random key/value pairs, store and retrieve, verify equality
    - **Property 5: Cache TTL expiry** — generate entries with old timestamps, verify retrieval returns null
    - **Validates: Requirements 1.3, 1.7, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 12.4**

- [x] 2. Checkpoint — Verify backend proxy endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add barcode field to admin report form and backend
  - [x] 3.1 Add barcode field to the report creation/edit form in admin.html
    - Add an optional text input with label "Barcode (EAN-13)", `pattern="[0-9]{13}"`, `maxlength="13"` in the report form grid after the "Status Badges" field
    - Add client-side validation: if non-empty, must be exactly 13 digits; show inline error otherwise
    - Include `barcode` in the form data sent on report creation and update
    - Pre-populate barcode field when editing an existing report
    - _Requirements: 12.1, 12.4_

  - [x] 3.2 Update the report creation and update endpoints in server.js to handle the barcode field
    - Accept optional `barcode` from request body in POST and PUT report endpoints
    - Validate barcode format server-side if provided (13 digits); reject with 400 if invalid
    - Store barcode as string in the test report document, or null if not provided
    - _Requirements: 12.2, 12.3_

  - [ ]* 3.3 Write unit tests for admin barcode storage
    - Test that report creation with barcode stores it in MongoDB document
    - Test that report creation without barcode stores null
    - Test that invalid barcode is rejected with 400
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 4. Checkpoint — Verify admin barcode field
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create the Product Lookup page (product-lookup.html)
  - [x] 5.1 Create product-lookup.html with page structure and styles
    - Use the same header, footer, fonts, and colour palette as purity-wall.html
    - Add search section with single input field (placeholder "Enter barcode or product name") and submit button
    - Add results area container for product detail view and search results grid
    - Add loading spinner and error/empty state elements
    - Add OFF attribution footer element
    - _Requirements: 4.1, 4.2, 10.3, 10.4_

  - [x] 5.2 Implement search input classification and API call logic
    - Detect input type: if `/^\d{13}$/` → call `GET /api/off/product/:barcode`; else if ≥ 2 chars → call `GET /api/off/search?q=term`
    - Handle loading state, error responses (400, 502, 504), and `{ found: false }`
    - Display "Product not found in Open Food Facts database" for not-found results
    - _Requirements: 4.3, 4.4, 4.6_

  - [x] 5.3 Implement Nutri-Score badge, NOVA group label, and Additive badge rendering helpers
    - Create `getNutriScoreColor(grade)` returning correct background colour per grade (A→#1F6B4E, B→#85BB65, C→#FFB703, D→#E67E22, E→#D62828) or null for missing grades
    - Create `getNovaLabel(group)` returning correct descriptive label per group (1-4) or null for missing groups
    - Create `getAdditiveColors(risk)` returning correct bg/text colours per risk level (low, moderate, high, unknown)
    - Render Nutri-Score as `<span class="nutri-score-badge">` with white bold text
    - Render NOVA as `<span class="nova-group">NOVA {group} — {label}</span>`
    - Render additives as `<span class="additive-badge">{E-number} — {name}</span>` with risk-level colouring
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.4 Implement product detail view rendering
    - Display: product name, brand, product image, Nutri-Score badge, NOVA group with label, full ingredients list, additive badges with risk colouring, allergens list, nutrition facts per 100g table
    - Display OFF attribution text "Data from Open Food Facts (openfoodfacts.org) under ODbL licence" with clickable link to https://openfoodfacts.org
    - _Requirements: 4.5, 4.8, 10.2, 10.3, 10.4_

  - [x] 5.5 Implement search results grid and product card click handling
    - Render search results as a grid of product cards showing name, brand, image, Nutri-Score badge, NOVA group
    - On card click, call barcode lookup for that product and render the full detail view
    - _Requirements: 4.4, 4.7_

  - [x] 5.6 Implement ChoosePure report cross-reference
    - After rendering product detail, fetch `GET /api/reports` and match by barcode field
    - If a matching ChoosePure report exists, display a "View ChoosePure Lab Report" link pointing to `/deep-dive?id={reportId}`
    - _Requirements: 4.9, 10.1_

  - [ ]* 5.7 Write property tests for frontend helper functions
    - **Property 6: Input type classification** — generate random strings, verify classification routes 13-digit numerics to barcode, others ≥ 2 chars to search, others to invalid
    - **Property 7: Nutri-Score colour mapping** — verify correct colour for each grade and null handling
    - **Property 8: NOVA group label mapping** — verify correct label for each group and null handling
    - **Property 10: Additive risk colour mapping** — verify correct bg/text colours for each risk level
    - **Validates: Requirements 4.3, 4.4, 5.1–5.7, 6.1–6.6, 11.1–11.5**

- [x] 6. Checkpoint — Verify Product Lookup page
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Enhance Purity Wall with Nutri-Score badges and filters (purity-wall.html)
  - [x] 7.1 Add Nutri-Score badge to report cards on the Purity Wall
    - After report cards load, for each report with a `barcode` field, fetch OFF data via `/api/off/product/:barcode`
    - Display a small Nutri-Score badge on the card image area at `bottom: 12px; left: 12px` (existing purity score badge is at right)
    - Store fetched OFF data in a client-side map keyed by report ID for filtering
    - Silently omit badge if OFF data fetch fails or product not found
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 7.2 Add Nutri-Score and NOVA group filter controls to the Purity Wall
    - Add a filter bar below the welcome banner with Nutri-Score dropdown (All, A, B, C, D, E) and NOVA group dropdown (All, 1, 2, 3, 4)
    - Implement client-side filtering: hide/show cards based on cached OFF data
    - Apply AND logic when both filters are active
    - Show empty state "No products match the selected filters" when no cards match
    - Cards without OFF data are excluded when a specific Nutri-Score or NOVA filter is active
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 7.3 Write property test for combined filtering logic
    - **Property 9: Combined Nutri-Score and NOVA filtering** — generate random arrays of report card objects with random nutriScore/novaGroup values, apply random filter combinations, verify result is correct AND-logic subset
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

- [x] 8. Checkpoint — Verify Purity Wall enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Enrich Deep Dive report page with OFF data (deep-dive.html)
  - [x] 9.1 Add OFF data section to the Deep Dive report page
    - After the existing report renders, check if the report document has a `barcode` field
    - If barcode exists, call `GET /api/off/product/:barcode`
    - On success (`found: true`), append a new section with heading "Supplemental Data from Open Food Facts"
    - Display: Nutri-Score badge, NOVA group with label, ingredients list, additive badges, allergens list
    - Display OFF attribution text at the bottom of the section
    - Visually separate from ChoosePure lab data with the section heading
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.3, 10.4_

  - [x] 9.2 Handle OFF data errors silently on Deep Dive page
    - If the proxy returns `{ found: false }`, a timeout, or any error, do not render the OFF section and do not show any error to the user
    - _Requirements: 7.5_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major phase
- Property tests validate universal correctness properties from the design document
- The project uses JavaScript (Node.js/Express backend, vanilla JS frontend with inline scripts)
- OFF data is always supplemental to ChoosePure lab data; attribution is required on every page showing OFF data
