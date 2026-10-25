# Requirements Document

## Introduction

The Curated Products feature enables ChoosePure administrators to search Open Food Facts (OFF), select products, edit their data, and save polished versions to a dedicated MongoDB collection. These curated products are surfaced as a "Popular Products" section on the mobile app's Dashboard, giving the admin full control over content quality while decoupling the curated experience from real-time barcode lookups.

## Glossary

- **Admin_Panel**: The web-based administration interface (`admin.html`) used by ChoosePure administrators to manage curated products
- **OFF_Proxy**: The backend endpoint that proxies search requests to the Open Food Facts API and normalizes results
- **Curated_Products_API**: The set of CRUD backend endpoints for managing curated product documents in MongoDB
- **Popular_Products_Endpoint**: The public read-only API endpoint that serves curated products marked as popular to the mobile app
- **DashboardScreen**: The main screen in the ChoosePure mobile app that displays popular products
- **Validator**: The server-side input validation logic that enforces data integrity rules on curated product documents
- **MongoDB_Collection**: The `curated_products` collection in MongoDB that stores curated product documents

## Requirements

### Requirement 1: OFF Search Proxy

**User Story:** As an admin, I want to search Open Food Facts from the admin panel, so that I can find products to curate without leaving the interface.

#### Acceptance Criteria

1. WHEN an admin submits a search query, THE OFF_Proxy SHALL forward the query to the Open Food Facts search API and return normalized results
2. WHEN the search query is empty or whitespace-only, THE OFF_Proxy SHALL return a 400 status with message "Search query required"
3. THE OFF_Proxy SHALL normalize each OFF result into a consistent shape containing name, brand, barcode, imageUrl, nutriscoreGrade, categories, and ingredients fields
4. WHEN a product from OFF has no product_name, THE OFF_Proxy SHALL exclude that product from the returned results
5. THE OFF_Proxy SHALL return at most 20 products per search query
6. WHEN the same search query is repeated within 24 hours, THE OFF_Proxy SHALL return cached results without contacting the OFF API
7. IF the Open Food Facts API is unavailable or returns an error, THEN THE OFF_Proxy SHALL return a 503 status with message "Unable to search Open Food Facts. Please try again."

### Requirement 2: Curated Product Creation

**User Story:** As an admin, I want to create curated products from OFF search results or manually, so that I can build a polished product catalog.

#### Acceptance Criteria

1. WHEN an admin submits a valid product creation request, THE Curated_Products_API SHALL insert a new document into the curated_products collection and return the created document with its generated ID
2. WHEN the productName field is missing or empty after trimming, THE Validator SHALL reject the request with a 400 status and message "Product name is required"
3. WHEN the source field is missing or not one of "open_food_facts" or "manual", THE Validator SHALL reject the request with a 400 status and message "Source must be open_food_facts or manual"
4. WHEN the nutriscoreGrade field is provided but not one of A, B, C, D, or E, THE Validator SHALL reject the request with a 400 status and message "Invalid nutriscore grade"
5. WHEN a barcode is provided that already exists in the collection, THE Curated_Products_API SHALL return a 409 status with message "A product with this barcode already exists" and perform no mutation
6. WHEN isPopular is not explicitly provided, THE Curated_Products_API SHALL default the value to true
7. WHEN displayOrder is not explicitly provided, THE Curated_Products_API SHALL default the value to 0

### Requirement 3: Curated Product Update

**User Story:** As an admin, I want to update curated product details, so that I can correct or improve product information over time.

#### Acceptance Criteria

1. WHEN an admin submits a valid update request with a valid product ID, THE Curated_Products_API SHALL update the specified fields and set updatedAt to the current timestamp
2. WHEN the product ID is not a valid ObjectId format, THE Curated_Products_API SHALL return a 400 status with message "Invalid product ID"
3. WHEN the product ID does not match any existing document, THE Curated_Products_API SHALL return a 404 status with message "Product not found"
4. WHEN a barcode update would conflict with an existing product's barcode, THE Curated_Products_API SHALL return a 409 status with message "A product with this barcode already exists"
5. WHEN nutriscoreGrade is included in the update but is not a valid grade, THE Validator SHALL reject the request with a 400 status

### Requirement 4: Curated Product Deletion

**User Story:** As an admin, I want to delete curated products, so that I can remove outdated or incorrect entries from the catalog.

#### Acceptance Criteria

1. WHEN an admin submits a delete request with a valid product ID, THE Curated_Products_API SHALL remove the document from the collection and return a success response
2. WHEN the product ID does not match any existing document, THE Curated_Products_API SHALL return a 404 status with message "Product not found"

### Requirement 5: Curated Product Listing for Admin

**User Story:** As an admin, I want to view all curated products in a list, so that I can browse and manage the catalog.

#### Acceptance Criteria

1. WHEN an admin requests the curated products list, THE Curated_Products_API SHALL return all curated product documents sorted by createdAt descending

### Requirement 6: Public Popular Products Endpoint

**User Story:** As a mobile app user, I want to see popular products on my Dashboard, so that I can discover recommended products without scanning.

#### Acceptance Criteria

1. THE Popular_Products_Endpoint SHALL return only curated products where isPopular is true
2. THE Popular_Products_Endpoint SHALL return results sorted by displayOrder ascending, then createdAt descending
3. THE Popular_Products_Endpoint SHALL project only the fields needed by the mobile app: productName, brand, imageUrl, barcode, category, description, nutriscoreGrade, and tags
4. WHEN no popular products exist, THE Popular_Products_Endpoint SHALL return an empty array with a success response
5. THE Popular_Products_Endpoint SHALL be publicly accessible without authentication

### Requirement 7: Authentication Enforcement

**User Story:** As a system operator, I want admin endpoints to be protected, so that only authenticated administrators can modify curated products.

#### Acceptance Criteria

1. WHEN a request to any admin curated products endpoint lacks a valid admin token, THE Curated_Products_API SHALL return a 401 status and perform no data mutation
2. WHEN a request to any admin OFF search endpoint lacks a valid admin token, THE OFF_Proxy SHALL return a 401 status

### Requirement 8: MongoDB Collection and Indexes

**User Story:** As a developer, I want proper database indexes on the curated_products collection, so that queries perform efficiently and constraints are enforced at the database level.

#### Acceptance Criteria

1. THE MongoDB_Collection SHALL have a unique sparse index on the barcode field
2. THE MongoDB_Collection SHALL have a compound index on { isPopular: 1, displayOrder: 1 } for efficient popular product queries
3. THE MongoDB_Collection SHALL have an index on { createdAt: -1 } for admin list sorting

### Requirement 9: Admin Panel Products Tab UI

**User Story:** As an admin, I want a dedicated Products tab in the admin panel, so that I can search, add, edit, and delete curated products through a visual interface.

#### Acceptance Criteria

1. WHEN the admin clicks the Products tab, THE Admin_Panel SHALL display a search box for querying Open Food Facts and a list of existing curated products
2. WHEN search results are displayed, THE Admin_Panel SHALL show each result as a card with product name, brand, image, and an "Add" button
3. WHEN the admin clicks "Add" on a search result, THE Admin_Panel SHALL open an edit form pre-filled with the OFF product data
4. WHEN the admin clicks "Edit" on an existing curated product, THE Admin_Panel SHALL open the edit form pre-filled with the current product data
5. WHEN the admin submits the edit form, THE Admin_Panel SHALL call the appropriate create or update endpoint and refresh the product list on success
6. WHEN the admin clicks "Delete" on a curated product, THE Admin_Panel SHALL prompt for confirmation and call the delete endpoint upon confirmation

### Requirement 10: Mobile Dashboard Popular Products Section

**User Story:** As a mobile app user, I want to see a "Popular Products" section on my Dashboard, so that I can browse curated recommendations.

#### Acceptance Criteria

1. WHEN the DashboardScreen mounts, THE DashboardScreen SHALL fetch products from the popular products endpoint
2. THE DashboardScreen SHALL render popular products as a horizontal scrollable list with product image, name, and nutriscore badge
3. WHEN a user taps a product card, THE DashboardScreen SHALL navigate to a product detail view showing full product information
4. WHEN the popular products endpoint returns an empty array, THE DashboardScreen SHALL hide the popular products section entirely
5. WHEN the user performs a pull-to-refresh, THE DashboardScreen SHALL re-fetch popular products

### Requirement 11: Data Validation Invariants

**User Story:** As a system operator, I want strict data validation on all curated product writes, so that the database maintains consistent and valid data.

#### Acceptance Criteria

1. THE Validator SHALL ensure every curated product document has a non-empty productName string
2. THE Validator SHALL ensure every curated product document has a source value of either "open_food_facts" or "manual"
3. THE Validator SHALL ensure nutriscoreGrade is one of A, B, C, D, E, or null for every curated product document
4. THE Validator SHALL ensure no two curated product documents share the same non-null barcode value
