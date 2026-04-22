# Requirements Document

## Introduction

ChoosePure is a platform where parents in Bangalore can view independent lab-test results for everyday packaged foods. This feature integrates the Open Food Facts (OFF) public API to enrich the platform with nutritional data for over 4 million products. The integration adds a backend proxy layer that caches OFF responses in memory, a new Product Lookup page for barcode and text search, enrichment of existing report detail pages with Nutri-Score, NOVA group, ingredients, and additive data, and enhancements to the Purity Wall with Nutri-Score badges and filtering. All OFF data is free, requires no authentication, and is licensed under ODbL. ChoosePure lab data always takes priority when available; OFF data is supplemental.

## Glossary

- **OFF_Proxy**: The backend API layer (Node.js/Express routes under `/api/off/`) that forwards requests to the Open Food Facts API, applies a 3-second timeout, and caches responses in memory.
- **OFF_Cache**: An in-memory JavaScript Map that stores OFF API responses keyed by barcode or search query, with a 24-hour time-to-live (TTL) per entry.
- **Product_Lookup_Page**: A new public page at `/product-lookup` where users can search for products by barcode or name and view OFF nutritional data.
- **Report_Detail_Page**: The existing deep-dive report page (`deep-dive.html`) that displays full lab-test results for a single product.
- **Purity_Wall**: The existing dashboard page (`purity-wall.html`) that displays report cards in a scrollable grid.
- **Nutri_Score**: A letter grade from A to E assigned by Open Food Facts indicating the overall nutritional quality of a food product (A is best, E is worst).
- **NOVA_Group**: A classification from 1 to 4 assigned by Open Food Facts indicating the degree of food processing (1 is unprocessed, 4 is ultra-processed).
- **Additive_Badge**: A UI element displaying an E-number additive with a colour-coded risk level (low, moderate, high).
- **OFF_Attribution**: A visible text element crediting Open Food Facts as the data source, including a link to openfoodfacts.org and the ODbL licence reference.
- **Barcode**: An EAN-13 product barcode used as the primary lookup key in the OFF API.

## Requirements

### Requirement 1: Backend Proxy for Product Barcode Lookup

**User Story:** As a frontend client, I want to fetch OFF product data through a ChoosePure backend proxy, so that the OFF API is not called directly from the browser and responses are cached.

#### Acceptance Criteria

1. WHEN the OFF_Proxy receives a GET request to `/api/off/product/:barcode` with a valid 13-digit barcode, THE OFF_Proxy SHALL forward the request to the Open Food Facts API at `https://world.openfoodfacts.org/api/v2/product/:barcode.json`.
2. THE OFF_Proxy SHALL include the User-Agent header `ChoosePure/1.0 (choosepure.in)` on every request to the Open Food Facts API.
3. WHEN the Open Food Facts API returns a product, THE OFF_Proxy SHALL respond with a JSON object containing: product name, brand, barcode, ingredients list, Nutri-Score grade (A-E), NOVA group (1-4), additives with E-numbers, allergens, nutrition facts per 100g, Eco-Score, and product image URL.
4. WHEN the Open Food Facts API returns no matching product for the given barcode, THE OFF_Proxy SHALL respond with `{ found: false }` and a 200 status code.
5. IF the Open Food Facts API does not respond within 3 seconds, THEN THE OFF_Proxy SHALL abort the request and respond with a 504 status code and an error message indicating a timeout.
6. IF the Open Food Facts API returns a non-200 status code, THEN THE OFF_Proxy SHALL respond with a 502 status code and an error message indicating an upstream failure.
7. WHEN the OFF_Proxy receives a barcode that is not exactly 13 digits, THE OFF_Proxy SHALL respond with a 400 status code and an error message indicating an invalid barcode format.

### Requirement 2: Backend Proxy for Product Text Search

**User Story:** As a frontend client, I want to search OFF products by name or brand through the backend proxy, so that users can find products without knowing the barcode.

#### Acceptance Criteria

1. WHEN the OFF_Proxy receives a GET request to `/api/off/search` with a query parameter `q` containing at least 2 characters, THE OFF_Proxy SHALL forward the request to the Open Food Facts search API.
2. THE OFF_Proxy SHALL limit search results to a maximum of 24 products per request.
3. WHEN the Open Food Facts search API returns results, THE OFF_Proxy SHALL respond with an array of product objects each containing: product name, brand, barcode, Nutri-Score grade, NOVA group, and product image URL.
4. WHEN the OFF_Proxy receives a search request with a `q` parameter shorter than 2 characters, THE OFF_Proxy SHALL respond with a 400 status code and an error message indicating the query is too short.
5. WHEN the OFF_Proxy receives a search request without a `q` parameter, THE OFF_Proxy SHALL respond with a 400 status code and an error message indicating the query parameter is required.
6. IF the Open Food Facts search API does not respond within 3 seconds, THEN THE OFF_Proxy SHALL abort the request and respond with a 504 status code and a timeout error message.

### Requirement 3: In-Memory Response Cache

**User Story:** As a system operator, I want OFF API responses to be cached in memory for 24 hours, so that repeated lookups for the same product do not make redundant external API calls.

#### Acceptance Criteria

1. WHEN the OFF_Proxy receives a successful response from the Open Food Facts API for a barcode lookup, THE OFF_Cache SHALL store the response keyed by the barcode with a 24-hour TTL.
2. WHEN the OFF_Proxy receives a request for a barcode that exists in the OFF_Cache and the cache entry has not expired, THE OFF_Proxy SHALL return the cached response without calling the Open Food Facts API.
3. WHEN a cache entry in the OFF_Cache has exceeded its 24-hour TTL, THE OFF_Cache SHALL treat the entry as expired and the OFF_Proxy SHALL fetch fresh data from the Open Food Facts API.
4. WHEN the OFF_Proxy receives a successful response from the Open Food Facts API for a text search, THE OFF_Cache SHALL store the response keyed by the normalised query string with a 24-hour TTL.
5. THE OFF_Cache SHALL use a JavaScript Map with timestamp-based expiry checks and SHALL NOT require Redis or any external caching service.
6. WHEN a `{ found: false }` response is received from the Open Food Facts API, THE OFF_Cache SHALL cache the not-found result for the same 24-hour TTL to avoid repeated lookups for non-existent products.

### Requirement 4: Product Lookup Page

**User Story:** As a parent, I want a dedicated page where I can search for any packaged food product by barcode or name, so that I can view its nutritional data and additive information even if ChoosePure has not tested it.

#### Acceptance Criteria

1. THE Product_Lookup_Page SHALL be accessible at the URL path `/product-lookup` without requiring authentication.
2. THE Product_Lookup_Page SHALL display a search input that accepts either a 13-digit barcode or a product name.
3. WHEN the user enters a 13-digit numeric string and submits, THE Product_Lookup_Page SHALL call the `/api/off/product/:barcode` endpoint.
4. WHEN the user enters a non-numeric string of at least 2 characters and submits, THE Product_Lookup_Page SHALL call the `/api/off/search?q=query` endpoint and display matching results as a list of product cards.
5. WHEN a barcode lookup returns a product, THE Product_Lookup_Page SHALL display: product name, brand, product image, Nutri-Score grade with colour-coded badge, NOVA group with label, full ingredients list, additives as Additive_Badges with risk-level colouring, allergens list, and nutrition facts per 100g.
6. WHEN a barcode lookup returns `{ found: false }`, THE Product_Lookup_Page SHALL display a message stating "Product not found in Open Food Facts database".
7. WHEN the user clicks a product card from search results, THE Product_Lookup_Page SHALL display the full product detail view for that product.
8. THE Product_Lookup_Page SHALL display the OFF_Attribution text "Data from Open Food Facts (openfoodfacts.org) under ODbL licence" with a link to openfoodfacts.org at the bottom of every product detail view.
9. WHEN a product returned by OFF also has a matching ChoosePure test report (matched by barcode or product name), THE Product_Lookup_Page SHALL display a link to the ChoosePure report with the text "View ChoosePure Lab Report".

### Requirement 5: Nutri-Score Display Specification

**User Story:** As a parent viewing product data, I want Nutri-Score grades displayed with consistent colour coding, so that I can quickly assess the nutritional quality of a product.

#### Acceptance Criteria

1. WHEN displaying a Nutri-Score grade of A, THE system SHALL render the badge with a dark green background (#1F6B4E).
2. WHEN displaying a Nutri-Score grade of B, THE system SHALL render the badge with a light green background (#85BB65).
3. WHEN displaying a Nutri-Score grade of C, THE system SHALL render the badge with a yellow background (#FFB703).
4. WHEN displaying a Nutri-Score grade of D, THE system SHALL render the badge with an orange background (#E67E22).
5. WHEN displaying a Nutri-Score grade of E, THE system SHALL render the badge with a red background (#D62828).
6. THE Nutri-Score badge SHALL display the letter grade in white bold text centred within the badge.
7. WHEN a product does not have a Nutri-Score grade available, THE system SHALL not render a Nutri-Score badge for that product.

### Requirement 6: NOVA Group Display Specification

**User Story:** As a parent viewing product data, I want NOVA group classifications displayed with descriptive labels, so that I can understand how processed a product is.

#### Acceptance Criteria

1. WHEN displaying a NOVA group of 1, THE system SHALL render the label "Unprocessed or minimally processed".
2. WHEN displaying a NOVA group of 2, THE system SHALL render the label "Processed culinary ingredients".
3. WHEN displaying a NOVA group of 3, THE system SHALL render the label "Processed foods".
4. WHEN displaying a NOVA group of 4, THE system SHALL render the label "Ultra-processed food and drink products".
5. THE NOVA group display SHALL include the numeric group value (1-4) alongside the descriptive label.
6. WHEN a product does not have a NOVA group available, THE system SHALL not render a NOVA group element for that product.

### Requirement 7: Report Detail Page Enrichment with OFF Data

**User Story:** As a subscribed user viewing a lab report, I want to see supplemental OFF data (Nutri-Score, NOVA, ingredients, additives) below the ChoosePure lab findings, so that I get a more complete picture of the product.

#### Acceptance Criteria

1. WHEN the Report_Detail_Page loads for a product that has a matching OFF record (matched by barcode stored in the test report), THE Report_Detail_Page SHALL display an "Open Food Facts Data" section below the ChoosePure lab findings.
2. THE "Open Food Facts Data" section SHALL display: Nutri-Score badge, NOVA group with label, ingredients list, additives as Additive_Badges, and allergens list.
3. WHILE the Report_Detail_Page displays both ChoosePure lab data and OFF data, THE Report_Detail_Page SHALL visually separate the two sections with a heading that reads "Supplemental Data from Open Food Facts".
4. THE Report_Detail_Page SHALL display the OFF_Attribution text at the bottom of the OFF data section.
5. IF the OFF_Proxy returns `{ found: false }` or a timeout error for the product barcode, THEN THE Report_Detail_Page SHALL not display the OFF data section and SHALL not show an error to the user.

### Requirement 8: Purity Wall Nutri-Score Badge on Report Cards

**User Story:** As a user browsing the Purity Wall, I want to see a Nutri-Score badge on each report card that has OFF data, so that I can quickly compare nutritional quality across products.

#### Acceptance Criteria

1. WHEN the Purity_Wall loads report cards, THE Purity_Wall SHALL attempt to fetch OFF data for each report that has a barcode stored in its test report record.
2. WHEN OFF data is available for a report card, THE Purity_Wall SHALL display a small Nutri-Score badge on the report card using the colour scheme defined in Requirement 5.
3. WHEN OFF data is not available for a report card, THE Purity_Wall SHALL display the report card without a Nutri-Score badge.
4. THE Nutri-Score badge on report cards SHALL be positioned adjacent to the existing purity score badge without overlapping.

### Requirement 9: Purity Wall Filtering by Nutri-Score and NOVA Group

**User Story:** As a user browsing the Purity Wall, I want to filter report cards by Nutri-Score grade and NOVA group, so that I can focus on products that meet my nutritional criteria.

#### Acceptance Criteria

1. THE Purity_Wall SHALL display a Nutri-Score filter control with options: All, A, B, C, D, E.
2. THE Purity_Wall SHALL display a NOVA group filter control with options: All, 1, 2, 3, 4.
3. WHEN the user selects a Nutri-Score filter value, THE Purity_Wall SHALL display only report cards whose OFF Nutri-Score grade matches the selected value.
4. WHEN the user selects a NOVA group filter value, THE Purity_Wall SHALL display only report cards whose OFF NOVA group matches the selected value.
5. WHEN both a Nutri-Score filter and a NOVA group filter are active, THE Purity_Wall SHALL display only report cards that match both filter criteria.
6. WHEN a filter is active and no report cards match the criteria, THE Purity_Wall SHALL display an empty state message "No products match the selected filters".
7. WHEN the user selects "All" for either filter, THE Purity_Wall SHALL remove that filter constraint and display all matching report cards.

### Requirement 10: Data Priority and Attribution

**User Story:** As a user, I want to clearly understand which data comes from ChoosePure lab tests and which comes from Open Food Facts, so that I can trust the information presented.

#### Acceptance Criteria

1. WHILE a product has both a ChoosePure test report and OFF data, THE system SHALL display ChoosePure lab data as the primary data source and OFF data as supplemental.
2. WHILE a product has only OFF data and no ChoosePure test report, THE Product_Lookup_Page SHALL display OFF data as the primary data source.
3. THE system SHALL display the OFF_Attribution text "Data from Open Food Facts (openfoodfacts.org) under ODbL licence" on every page or section that renders OFF data.
4. THE OFF_Attribution text SHALL include a clickable hyperlink to `https://openfoodfacts.org`.

### Requirement 11: Additive Risk Display

**User Story:** As a parent, I want additives displayed with colour-coded risk levels, so that I can quickly identify potentially concerning ingredients.

#### Acceptance Criteria

1. WHEN displaying an additive classified as low risk by Open Food Facts, THE Additive_Badge SHALL render with a green background (#E8F5E9) and dark green text (#2E7D32).
2. WHEN displaying an additive classified as moderate risk by Open Food Facts, THE Additive_Badge SHALL render with an amber background (#FFF8E1) and dark amber text (#E65100).
3. WHEN displaying an additive classified as high risk by Open Food Facts, THE Additive_Badge SHALL render with a red background (#FFEBEE) and dark red text (#C62828).
4. THE Additive_Badge SHALL display the E-number and the additive name.
5. WHEN an additive does not have a risk classification from Open Food Facts, THE Additive_Badge SHALL render with a neutral grey background (#F5F5F5) and grey text (#6B6B6B).

### Requirement 12: Barcode Field in Test Reports

**User Story:** As an admin creating test reports, I want to store a product barcode in each test report, so that the system can automatically match reports with OFF data.

#### Acceptance Criteria

1. THE admin report creation form SHALL include an optional barcode input field that accepts a 13-digit EAN-13 barcode.
2. WHEN the admin submits a test report with a barcode, THE Subscription_Service SHALL store the barcode in the test report document in MongoDB.
3. WHEN the admin submits a test report without a barcode, THE Subscription_Service SHALL store the test report with a null barcode field.
4. IF the admin enters a barcode that is not exactly 13 digits, THEN THE admin report creation form SHALL display a validation error and prevent submission.
