# Implementation Plan: Admin Manual Vote

## Overview

Add a manual vote capability to the Admin Panel's Polling tab, allowing authenticated admins to cast votes for active products on behalf of users without Razorpay payment. This involves a new POST endpoint in `server.js`, a new form in `admin.html`, modifications to the existing transactions display, and updates to the transactions API projection. Implementation uses JavaScript (Node.js/Express backend, vanilla JS frontend) following existing project patterns.

## Tasks

- [x] 1. Implement the manual vote API endpoint in `server.js`
  - [x] 1.1 Implement `POST /api/admin/polls/manual-vote` endpoint
    - Protect with `authenticateAdmin` middleware
    - Validate required fields: productId, voteCount (integer 1–50), voterName (non-empty), voterEmail (valid email regex), voterPhone (exactly 10 digits)
    - Return descriptive validation errors identifying the invalid fields (e.g., "Product selection is required", "Vote count must be between 1 and 50")
    - Verify the product exists and has `status: "active"`, return 404 if not found or inactive
    - Insert a `vote_transaction` record with: productId, productName, userName, userEmail, userPhone, voteCount, `amount: 0`, `isManualVote: true`, adminEmail (from `req.admin.email`), reason (if provided), `status: "completed"`, `createdAt: new Date()`
    - Increment the product's `totalVotes` by the submitted voteCount using `$inc`
    - Return `{ success: true, message: "Successfully cast N votes for ProductName", updatedVoteCount }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 1.2 Write property test for vote count range validation
    - **Property 1: Vote count range validation**
    - **Validates: Requirements 2.2**

  - [ ]* 1.3 Write property test for email format validation
    - **Property 2: Email format validation**
    - **Validates: Requirements 2.4**

  - [ ]* 1.4 Write property test for phone format validation
    - **Property 3: Phone format validation**
    - **Validates: Requirements 2.5**

  - [ ]* 1.5 Write property test for validation rejects incomplete requests without side effects
    - **Property 6: Validation rejects incomplete requests without side effects**
    - **Validates: Requirements 3.5**

- [x] 2. Update the transactions API to include manual vote fields
  - [x] 2.1 Modify `GET /api/admin/polls/transactions` endpoint projection in `server.js`
    - Add `isManualVote`, `reason`, and `adminEmail` to the `.project()` call on the transactions query
    - No changes needed to the summary aggregation (manual votes have `amount: 0`, so they naturally contribute 0 to revenue and their `voteCount` is already included in total votes)
    - _Requirements: 5.2, 6.1, 6.2_

  - [ ]* 2.2 Write property test for manual vote transaction record completeness
    - **Property 4: Manual vote transaction record completeness**
    - **Validates: Requirements 3.2, 5.2**

  - [ ]* 2.3 Write property test for vote count increment and response correctness
    - **Property 5: Vote count increment and response correctness**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 2.4 Write property test for summary aggregation correctness
    - **Property 7: Summary aggregation correctness**
    - **Validates: Requirements 6.1, 6.2**

- [x] 3. Checkpoint - Ensure all backend changes work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add the manual vote form to the Admin Panel
  - [x] 4.1 Add "Cast Manual Vote" form card to the Polling tab in `admin.html`
    - Place the form between the existing "Add New Product" form and the "Products" table
    - Use the existing `.actions` card styling and `.form-group` patterns
    - Include a product dropdown (`<select>`) that will be populated with active products
    - Include a vote count input (`<input type="number" min="1" max="50">`)
    - Include voter name input (`<input type="text">`)
    - Include voter email input (`<input type="email">`)
    - Include voter phone input (`<input type="tel" pattern="[0-9]{10}">`)
    - Include an optional reason textarea (`<textarea>`)
    - Include a submit button and a message div for success/error feedback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Implement `submitManualVote()` function in `admin.html`
    - Perform client-side validation: product selected, vote count 1–50, voter name non-empty, email format, phone 10 digits
    - Display specific validation error messages for each invalid field
    - On valid submission, POST to `/api/admin/polls/manual-vote` with credentials included
    - On success: display success message with vote count and product name, clear the form fields, call `loadProducts()` and `loadTransactions()` to refresh data
    - On server error: display the error message from the server response
    - On network error: display "Network error. Please try again."
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.3 Populate the product dropdown when products are loaded
    - Update the `loadProducts()` or `displayProducts()` function to also populate the manual vote product dropdown with active products (name and ID)
    - _Requirements: 1.2_

- [x] 5. Update the transactions display to show manual vote indicators
  - [x] 5.1 Modify `displayTransactions()` function in `admin.html`
    - Add a "Manual" badge (styled span) on transaction rows where `isManualVote === true`
    - Display the `reason` text alongside manual vote transactions when present
    - Add a "Type" column or integrate the badge into an existing column (e.g., next to Payment ID, showing "Manual" badge instead of payment ID for manual votes)
    - _Requirements: 5.1, 5.3_

- [x] 6. Final checkpoint - Ensure all changes work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library for JavaScript
- Checkpoints ensure incremental validation
- The existing summary aggregation naturally handles revenue exclusion since manual votes have `amount: 0`
- No database migration is needed — MongoDB's flexible schema handles the new fields (`isManualVote`, `adminEmail`, `reason`) on new documents
