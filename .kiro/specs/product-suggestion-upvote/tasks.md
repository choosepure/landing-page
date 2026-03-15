# Implementation Plan: Product Suggestion & Upvote

## Overview

Incrementally add product suggestion submission, public display with upvoting, and admin management to the existing ChoosePure platform. Each task builds on the previous, starting with the backend data layer, then public-facing features, then admin features, and finally wiring everything together.

## Tasks

- [x] 1. Set up product_suggestions collection and backend foundation
  - [x] 1.1 Initialize `suggestionsCollection` in `connectToDatabase()` in server.js
    - Add `let suggestionsCollection;` alongside existing collection variables
    - Set `suggestionsCollection = db.collection('product_suggestions');` in `connectToDatabase()`
    - Create indexes: `{ status: 1, upvotes: -1 }` and `{ createdAt: -1 }`
    - Log initialization confirmation
    - _Requirements: 2.4, 3.2_

  - [x] 1.2 Implement POST `/api/suggestions` endpoint in server.js
    - Accept `productName`, `category`, `reason`, `userName`, `userEmail` from request body
    - Validate required fields (productName, category, userName, userEmail) — return 400 with missing field names if any are absent
    - Validate email format with regex — return 400 if invalid
    - Insert into `product_suggestions` with `upvotes: 0`, `status: "pending"`, `createdAt: new Date()`
    - Return `{ success: true, suggestion }` on success
    - Return 500 with error message if database not connected
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Implement GET `/api/suggestions` endpoint in server.js
    - Query `product_suggestions` where `status: "approved"`
    - Sort by `upvotes: -1` (descending)
    - Return `{ success: true, suggestions }` array
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.4 Implement POST `/api/suggestions/:id/upvote` endpoint in server.js
    - Parse suggestion ID from params, convert to ObjectId
    - Use `findOneAndUpdate` with `$inc: { upvotes: 1 }` and `returnDocument: 'after'`
    - Return 404 if suggestion not found
    - Return `{ success: true, upvotes: updatedDoc.upvotes }` on success
    - _Requirements: 4.2_

  - [ ]* 1.5 Write property tests for suggestion creation and validation (Properties 1, 2, 3)
    - **Property 1: Suggestion creation round-trip** — generate valid suggestion data, create via POST, read back from DB, verify fields match with upvotes=0, status="pending", createdAt present
    - **Validates: Requirements 1.2, 2.4**
    - **Property 2: Suggestion validation rejects incomplete submissions** — generate subsets of required fields with at least one missing, verify 400 response
    - **Validates: Requirements 2.1, 2.2**
    - **Property 3: Email validation rejects invalid formats** — generate non-email strings, verify 400 response
    - **Validates: Requirements 2.3**

  - [ ]* 1.6 Write property tests for public listing and upvote (Properties 4, 5)
    - **Property 4: Public suggestions endpoint returns only approved suggestions sorted by upvotes descending** — insert suggestions with mixed statuses and upvote counts, verify GET returns only approved sorted desc
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 5: Upvote increments count by exactly one** — create suggestion with N upvotes, upvote once, verify count = N+1
    - **Validates: Requirements 4.2**

- [x] 2. Checkpoint - Verify backend public endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement admin suggestion endpoints in server.js
  - [x] 3.1 Implement GET `/api/admin/suggestions` endpoint (protected by `authenticateAdmin`)
    - Query all suggestions from `product_suggestions` regardless of status
    - Sort by `createdAt: -1` (most recent first)
    - Return `{ success: true, suggestions }` array
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Implement PUT `/api/admin/suggestions/:id/status` endpoint (protected by `authenticateAdmin`)
    - Accept `status` from request body (must be one of: "pending", "approved", "rejected")
    - Update suggestion's `status` and set `updatedAt: new Date()`
    - Return 404 if suggestion not found
    - Return `{ success: true, suggestion }` on success
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.3 Implement DELETE `/api/admin/suggestions/:id` endpoint (protected by `authenticateAdmin`)
    - Delete suggestion by ID from `product_suggestions`
    - Return 404 if suggestion not found (deleteOne result.deletedCount === 0)
    - Return `{ success: true }` on success
    - _Requirements: 7.2, 7.3_

  - [x] 3.4 Implement POST `/api/admin/suggestions/:id/convert` endpoint (protected by `authenticateAdmin`)
    - Accept `imageUrl`, `description`, `minAmount` from request body
    - Validate required fields — return 400 if any missing
    - Validate `minAmount > 0` — return 400 if invalid
    - Lookup suggestion by ID — return 404 if not found
    - Verify suggestion status is "approved" — return 400 if not
    - Insert new product into `products` collection with suggestion's `productName` as `name`, provided `imageUrl`, `description`, `minAmount`, `totalVotes: 0`, `status: "active"`, `createdAt: new Date()`
    - Update suggestion status to "converted" with `updatedAt: new Date()`
    - Return `{ success: true, product }` on success
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 3.5 Write property tests for admin endpoints (Properties 6, 7, 8, 9, 10)
    - **Property 6: Admin suggestions endpoint returns all suggestions sorted by date descending** — insert suggestions with mixed statuses, verify all returned sorted by createdAt desc
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - **Property 7: Status update persists new status and sets updatedAt** — create suggestion, update to random valid status, verify persistence
    - **Validates: Requirements 6.2, 6.3**
    - **Property 8: Suggestion deletion removes the suggestion** — create suggestion, delete, verify not found
    - **Validates: Requirements 7.2**
    - **Property 9: Conversion creates product and marks suggestion as converted** — create approved suggestion, convert with valid data, verify product created and suggestion status = "converted"
    - **Validates: Requirements 8.3, 8.4**
    - **Property 10: Conversion validation rejects missing fields** — generate conversion requests with at least one missing field, verify 400
    - **Validates: Requirements 8.6**

- [x] 4. Checkpoint - Verify all backend endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add suggestion form and suggestions list to polling.html
  - [x] 5.1 Add "Suggest a Product" form section to polling.html below the product grid
    - Add HTML section with heading "Suggest a Product" and form fields: product name (required), category/type (required), reason (optional), your name (required), your email (required)
    - Style using existing CSS variables (--deep-leaf-green, --pure-ivory, --grain-brown, --font-primary)
    - Add client-side validation: required field checks, email format regex
    - Show validation errors inline below each field
    - On submit, POST to `API_BASE + '/api/suggestions'`
    - Show success message on success, error message on failure
    - Refresh suggestions list after successful submission
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 5.2 Add approved suggestions list section to polling.html below the suggestion form
    - Add HTML section with heading "Community Suggestions"
    - Fetch approved suggestions from `API_BASE + '/api/suggestions'` on page load
    - Render each suggestion as a card showing: product name, category, reason, submitter first name (split userName on space, take first), upvote count, submission date
    - Add upvote button (▲ icon + count) per suggestion card
    - Show loading spinner while fetching, error message with retry on failure
    - Show empty state message when no approved suggestions exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

  - [x] 5.3 Implement upvote functionality with localStorage tracking in polling.html
    - On upvote button click, POST to `API_BASE + '/api/suggestions/' + id + '/upvote'`
    - On success, update displayed count without page reload
    - Store upvoted suggestion IDs in localStorage key `choosepure_upvoted_suggestions` (JSON array)
    - On page load, read localStorage and apply "already upvoted" visual state (filled/highlighted button) to matching suggestions
    - On API error, show brief error notification and revert optimistic count update
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Checkpoint - Verify polling page suggestion features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add admin suggestions management to admin.html
  - [x] 7.1 Add "Product Suggestions" subsection to admin.html within the Product Polling section
    - Add HTML table below the existing Vote Transactions table with columns: Product Name, Category, Reason, Submitter, Email, Status, Upvotes, Date, Actions
    - Fetch all suggestions from `/api/admin/suggestions` on page load
    - Display status as colored badge (pending=amber, approved=green, rejected=red, converted=blue)
    - Sort by submission date descending (most recent first)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.2 Implement status management controls in admin.html
    - Add Approve/Reject buttons for each suggestion row
    - On click, call PUT `/api/admin/suggestions/:id/status` with new status
    - Update the row's status badge on success
    - Show error alert on failure
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.3 Implement suggestion deletion in admin.html
    - Add Delete button for each suggestion row
    - Show `confirm()` dialog before proceeding
    - On confirm, call DELETE `/api/admin/suggestions/:id`
    - Remove row from table on success, show success alert
    - Show error alert on failure or 404
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.4 Implement "Convert to Product" modal and functionality in admin.html
    - Add "Convert to Product" button for suggestions with status "approved"
    - On click, open modal pre-filled with suggestion's product name and category
    - Modal has additional fields: Image URL, Description, Minimum Amount per Vote
    - On submit, call POST `/api/admin/suggestions/:id/convert` with form data
    - On success, update suggestion row to show "converted" badge, disable convert button
    - Show error alert on failure (missing fields, non-approved, etc.)
    - For suggestions with "converted" status, show "converted" badge and disable the convert button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` library for JavaScript
- All admin endpoints reuse the existing `authenticateAdmin` middleware
- Frontend uses existing CSS variables and design patterns from polling.html and admin.html
