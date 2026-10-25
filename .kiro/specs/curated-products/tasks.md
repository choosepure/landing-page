# Implementation Plan: Curated Products

## Overview

This plan implements the Curated Products feature end-to-end: backend API endpoints (OFF search proxy, CRUD for curated products, public popular endpoint), MongoDB collection with indexes, admin panel Products tab UI, and mobile Dashboard popular products section. The implementation follows the existing patterns in server.js and admin.html.

## Tasks

- [x] 1. Add MongoDB collection initialization with indexes
  - [x] 1.1 Create the curated_products collection variable and initialize indexes in server.js
    - Add `let curatedProductsCollection;` alongside existing collection declarations
    - In the MongoDB connection callback (where other collections are initialized), add `curatedProductsCollection = db.collection('curated_products');`
    - Create indexes after collection initialization:
      - `curatedProductsCollection.createIndex({ barcode: 1 }, { unique: true, sparse: true })`
      - `curatedProductsCollection.createIndex({ isPopular: 1, displayOrder: 1 })`
      - `curatedProductsCollection.createIndex({ createdAt: -1 })`
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Add backend API endpoints
  - [x] 2.1 Implement GET /api/admin/off-search endpoint in server.js
    - Add route `app.get('/api/admin/off-search', authenticateAdmin, offSearchHandler)`
    - Validate `req.query.q` is non-empty after trimming; return 400 if empty
    - Check existing `offCache` Map for cached results (key: `off-search:<lowercase query>`)
    - If not cached, fetch from `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&fields=product_name,brands,code,image_url,image_front_url,nutriscore_grade,categories,ingredients_text`
    - Normalize results: map to `{ name, brand, barcode, imageUrl, nutriscoreGrade, categories, ingredients }`, filter out products without `product_name`, limit to 20
    - Cache normalized results with 24h TTL
    - On fetch error, return 503 with message "Unable to search Open Food Facts. Please try again."
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.2_

  - [x] 2.2 Implement POST /api/admin/curated-products endpoint in server.js
    - Add route `app.post('/api/admin/curated-products', authenticateAdmin, createCuratedProduct)`
    - Validate required fields: productName (non-empty after trim), source (must be 'open_food_facts' or 'manual')
    - Validate optional fields: nutriscoreGrade (if provided, must be A-E), tags (must be array if provided), displayOrder (must be number if provided)
    - Check barcode uniqueness if barcode is provided (query collection for existing)
    - Build document with defaults: `isPopular: true`, `displayOrder: 0`, `tags: []`, `createdAt: new Date()`, `updatedAt: new Date()`
    - Normalize nutriscoreGrade to uppercase
    - Insert document and return 201 with `{ success: true, product: document }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 11.1, 11.2, 11.3, 11.4_

  - [x] 2.3 Implement GET /api/admin/curated-products endpoint in server.js
    - Add route `app.get('/api/admin/curated-products', authenticateAdmin, listCuratedProducts)`
    - Query `curatedProductsCollection.find({}).sort({ createdAt: -1 }).toArray()`
    - Return `{ success: true, products: results }`
    - _Requirements: 5.1, 7.1_

  - [x] 2.4 Implement PUT /api/admin/curated-products/:id endpoint in server.js
    - Add route `app.put('/api/admin/curated-products/:id', authenticateAdmin, updateCuratedProduct)`
    - Validate ObjectId format; return 400 if invalid
    - Validate nutriscoreGrade if provided (A-E enum)
    - Check barcode uniqueness against other documents if barcode is being updated
    - Normalize nutriscoreGrade to uppercase if provided
    - Set `updatedAt: new Date()` in the update
    - Use `findOneAndUpdate` with `returnDocument: 'after'`; return 404 if not found
    - Return `{ success: true, product: result.value }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 11.3, 11.4_

  - [x] 2.5 Implement DELETE /api/admin/curated-products/:id endpoint in server.js
    - Add route `app.delete('/api/admin/curated-products/:id', authenticateAdmin, deleteCuratedProduct)`
    - Validate ObjectId format; return 400 if invalid
    - Use `deleteOne`; return 404 if `deletedCount === 0`
    - Return `{ success: true, message: 'Product deleted' }`
    - _Requirements: 4.1, 4.2, 7.1_

  - [x] 2.6 Implement GET /api/products/popular public endpoint in server.js
    - Add route `app.get('/api/products/popular', getPopularProducts)` (no auth middleware)
    - Query `curatedProductsCollection.find({ isPopular: true }).sort({ displayOrder: 1, createdAt: -1 }).project({ productName: 1, brand: 1, imageUrl: 1, barcode: 1, category: 1, description: 1, nutriscoreGrade: 1, tags: 1 }).toArray()`
    - Return `{ success: true, products: results }`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Checkpoint - Verify backend endpoints
  - Test all endpoints manually or confirm they compile without errors. Ask the user if questions arise.

- [x] 4. Add admin panel Products tab UI
  - [x] 4.1 Add Products tab navigation to admin.html
    - Add a "Products" tab button in the existing tab navigation bar (alongside existing tabs like Reports, Users, etc.)
    - Add corresponding tab content container `<div id="products-section">` with the Products tab layout
    - Add `switchTab('products')` handler following the existing tab switching pattern
    - Include the search box, results area, and curated products list area in the layout
    - _Requirements: 9.1_

  - [x] 4.2 Implement OFF search functionality in admin.html
    - Add search input with a "Search OFF" button in the products tab
    - On search button click or Enter key, call `GET /api/admin/off-search?q=<query>` with credentials
    - Display results as cards showing: product image (or placeholder), product name, brand, barcode, nutriscore badge, and an "Add" button
    - Show loading spinner during search; show "No results found" if empty
    - Handle 503 error with user-friendly message
    - _Requirements: 9.2_

  - [x] 4.3 Implement add/edit product modal form in admin.html
    - Create a modal form with fields: productName (required), brand, imageUrl, barcode, category, description, nutriscoreGrade (dropdown: A-E or empty), ingredients, tags (comma-separated input), source (auto-filled), offProductId (auto-filled if from OFF), isPopular (checkbox, default checked), displayOrder (number input, default 0)
    - When "Add" is clicked on an OFF search result, open the modal pre-filled with the OFF data, source='open_food_facts', and offProductId set
    - When "Edit" is clicked on an existing product, open the modal pre-filled with the current product data
    - On submit: call POST (create) or PUT (update) as appropriate, show success/error toast, close modal and refresh list
    - Handle 409 (duplicate barcode) and 400 (validation) errors with specific messages
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 4.4 Implement curated products list and delete functionality in admin.html
    - On tab load, fetch `GET /api/admin/curated-products` and render as a table/list
    - Each row shows: image thumbnail, product name, brand, category, nutriscore, source, displayOrder, and Edit/Delete action buttons
    - Delete button shows a confirmation prompt (confirm dialog); on confirm, calls `DELETE /api/admin/curated-products/:id`
    - On successful delete, remove the row from the UI and show success toast
    - _Requirements: 9.6, 5.1_

- [x] 5. Add mobile Dashboard popular products section
  - [x] 5.1 Create PopularProductsSection component and usePopularProducts hook
    - Create `src/components/PopularProductsSection.js` in the mobile app
    - Implement `usePopularProducts()` hook that fetches from `/api/products/popular` using the existing `apiClient`
    - Returns `{ products, loading, error, refetch }`
    - Create `PopularProductsSection` component that renders a horizontal `FlatList` with product cards
    - Each card shows: product image (with fallback placeholder), product name, nutriscore badge (colored by grade using brand colors)
    - If products array is empty, return null (hide the section)
    - On card press, call `onProductPress(product)` prop
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 5.2 Integrate PopularProductsSection into DashboardScreen
    - Import `PopularProductsSection` into `DashboardScreen.js`
    - Add the section to the Dashboard layout (above or below existing content, as a "Popular Products" section with header)
    - Pass navigation handler: on product press, navigate to a ProductDetailView (or modal) showing full product info (name, brand, description, image, ingredients, nutriscore, category, tags)
    - Wire `refetch` to the existing pull-to-refresh mechanism on DashboardScreen
    - _Requirements: 10.2, 10.3, 10.5_

- [x] 6. Wire everything together and final verification
  - [x] 6.1 Verify end-to-end flow
    - Ensure the Products tab loads in admin panel without JS errors
    - Ensure OFF search returns results and "Add" opens the form
    - Ensure creating, editing, and deleting products works through the admin UI
    - Ensure the mobile popular endpoint returns the created products
    - Ensure DashboardScreen renders the popular products section
    - Ask the user to test and confirm
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 9.1, 10.1_

## Notes

- This feature uses only existing dependencies (Express, MongoDB, axios in mobile, React Native FlatList)
- The OFF search cache reuses the existing `offCache` Map pattern already in server.js
- Admin auth uses the existing `authenticateAdmin` middleware (JWT cookie-based)
- The mobile app uses the existing `apiClient` (axios) for API calls
- No new npm packages are needed
- Brand colors from the guidelines: Deep Leaf Green (#1F6B4E) for primary, Mint (#95DB93) for success/good nutriscore

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "5.1"] },
    { "id": 3, "tasks": ["5.2"] },
    { "id": 4, "tasks": ["6.1"] }
  ]
}
```
