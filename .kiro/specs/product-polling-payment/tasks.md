# Implementation Plan: Product Polling and Payment Gateway

## Overview

Extend the existing ChoosePure platform with product polling and Razorpay payment processing. This involves adding two new MongoDB collections (`products`, `vote_transactions`), new API endpoints in `server.js`, a new public `polling.html` page, and a new "Product Polling" section in `admin.html`. Implementation uses JavaScript (Node.js/Express backend, vanilla JS frontend) following existing project patterns.

## Tasks

- [x] 1. Set up data models and dependencies
  - [x] 1.1 Install the `razorpay` npm package and initialize the Razorpay client in `server.js`
    - Add `razorpay` to dependencies in `package.json`
    - Import and initialize `new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })` in `server.js`
    - Add `productsCollection` and `voteTransactionsCollection` variables alongside existing `waitlistCollection` and `usersCollection`
    - _Requirements: 5.1_

  - [x] 1.2 Create MongoDB collections and indexes in the `connectToDatabase` function in `server.js`
    - Initialize `productsCollection = db.collection('products')` and `voteTransactionsCollection = db.collection('vote_transactions')`
    - Create index `{ status: 1, totalVotes: -1 }` on `products` collection
    - Create index `{ productId: 1 }` on `vote_transactions` collection
    - Create index `{ createdAt: -1 }` on `vote_transactions` collection
    - _Requirements: 1.3, 5.5_

- [x] 2. Implement admin product CRUD API endpoints in `server.js`
  - [x] 2.1 Implement `POST /api/admin/polls/products` endpoint (create product)
    - Validate required fields: name, imageUrl, description, minAmount (> 0)
    - Return descriptive validation errors identifying missing/invalid fields
    - Store product with `totalVotes: 0`, `status: "active"`, `createdAt`, `updatedAt` timestamps
    - Protect with `authenticateAdmin` middleware
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 2.2 Write property test for product creation validation (Property 1)
    - **Property 1: Product creation validation rejects incomplete submissions**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 2.3 Write property test for product creation round-trip (Property 2)
    - **Property 2: Product creation round-trip**
    - **Validates: Requirements 1.3**

  - [x] 2.4 Implement `GET /api/admin/polls/products` endpoint (list all products for admin)
    - Return all products including inactive ones, sorted by `createdAt` descending
    - Include name, imageUrl, description, minAmount, totalVotes, status
    - Protect with `authenticateAdmin` middleware
    - _Requirements: 2.1_

  - [x] 2.5 Implement `PUT /api/admin/polls/products/:id/status` endpoint (toggle status)
    - Toggle product status between "active" and "inactive"
    - Return 404 if product not found
    - Protect with `authenticateAdmin` middleware
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.6 Write property test for status toggle round-trip (Property 3)
    - **Property 3: Status toggle round-trip**
    - **Validates: Requirements 2.2**

  - [x] 2.7 Implement `DELETE /api/admin/polls/products/:id` endpoint (delete product)
    - Remove product from database, return 404 if not found
    - Protect with `authenticateAdmin` middleware
    - _Requirements: 2.4_

  - [ ]* 2.8 Write property test for product deletion (Property 5)
    - **Property 5: Product deletion removes the product**
    - **Validates: Requirements 2.4**

- [x] 3. Implement public product listing and voting API endpoints in `server.js`
  - [x] 3.1 Implement `GET /api/polls/products` endpoint (public product listing)
    - Return only active products sorted by `totalVotes` descending
    - Include name, imageUrl, description, minAmount, totalVotes for each product
    - No authentication required
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.2 Write property test for public product filtering and sorting (Property 4)
    - **Property 4: Public API returns only active products, sorted by votes descending**
    - **Validates: Requirements 2.3, 3.1, 3.2**

  - [x] 3.3 Implement `POST /api/polls/vote` endpoint (create Razorpay order)
    - Validate productId, voteCount (1–50), userName, userEmail (regex), userPhone (10 digits)
    - Verify product exists and is active
    - Calculate total amount as `voteCount * product.minAmount`
    - Create Razorpay order via `razorpay.orders.create()` with amount in paise
    - Return `{ orderId, amount, key: process.env.RAZORPAY_KEY_ID }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

  - [ ]* 3.4 Write property test for vote count range validation (Property 6)
    - **Property 6: Vote count range validation**
    - **Validates: Requirements 4.1**

  - [ ]* 3.5 Write property test for total amount calculation (Property 7)
    - **Property 7: Total amount calculation**
    - **Validates: Requirements 4.2, 5.1**

  - [ ]* 3.6 Write property test for vote submission user input validation (Property 8)
    - **Property 8: Vote submission user input validation**
    - **Validates: Requirements 4.3, 4.4**

  - [x] 3.7 Implement `POST /api/polls/verify-payment` endpoint (verify payment and record votes)
    - Accept `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `productId`, `voteCount`, user details
    - Verify signature using HMAC SHA256 with `RAZORPAY_WEBHOOK_SECRET`
    - On success: insert `vote_transaction` record with all required fields, increment product `totalVotes`
    - On failure: return error, do not increment votes
    - Return `{ success: true, updatedVoteCount }` on success
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 3.8 Write property test for payment signature verification (Property 9)
    - **Property 9: Payment signature verification**
    - **Validates: Requirements 5.4**

  - [ ]* 3.9 Write property test for vote count conditional update (Property 10)
    - **Property 10: Vote count changes if and only if payment verification succeeds**
    - **Validates: Requirements 5.6, 5.7**

  - [ ]* 3.10 Write property test for vote transaction record completeness (Property 11)
    - **Property 11: Vote transaction record completeness**
    - **Validates: Requirements 5.5**

- [x] 4. Checkpoint - Ensure all backend endpoints work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement admin vote transactions and stats endpoint in `server.js`
  - [x] 5.1 Implement `GET /api/admin/polls/transactions` endpoint
    - Return recent vote transactions with userName, userEmail, productName, voteCount, amount, razorpayPaymentId, createdAt
    - Include summary stats: total votes (sum of all voteCount) and total revenue (sum of all amount)
    - Protect with `authenticateAdmin` middleware
    - _Requirements: 6.1, 6.2_

  - [ ]* 5.2 Write property test for admin transaction summary aggregation (Property 12)
    - **Property 12: Admin transaction summary aggregation**
    - **Validates: Requirements 6.1, 6.2**

- [x] 6. Build the admin panel Product Polling section in `admin.html`
  - [x] 6.1 Add "Product Polling" section to `admin.html` with the add product form
    - Add form with fields: product name, image URL, description, minimum amount (INR)
    - Display success/error messages on form submission
    - Wire form to `POST /api/admin/polls/products`
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 6.2 Add product list table to the admin Product Polling section
    - Display all products with name, image thumbnail, description, minAmount, totalVotes, status
    - Add status toggle button (active/inactive) wired to `PUT /api/admin/polls/products/:id/status`
    - Add delete button wired to `DELETE /api/admin/polls/products/:id` with confirmation dialog
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 6.3 Add vote transactions table and summary stats to admin panel
    - Display recent transactions: user name, email, product name, vote count, amount, payment ID, timestamp
    - Display summary stats cards: total votes cast, total revenue collected
    - Wire to `GET /api/admin/polls/transactions`
    - _Requirements: 6.1, 6.2_

- [x] 7. Build the public polling page (`polling.html`)
  - [x] 7.1 Create `polling.html` with page structure, styles, and product grid
    - Match existing brand design: Inter font, Deep Leaf Green (#1F6B4E), Pure Ivory (#FAFAF7), Grain Brown (#8A6E4B)
    - Include header with logo, navigation link back to home
    - Display product cards in a responsive grid: image, name, description, min amount per vote, total vote count
    - Show loading spinner while fetching products
    - Show error message with retry button on fetch failure
    - Fetch products from `GET https://api.choosepure.in/api/polls/products`
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 7.2 Implement vote modal with quantity selector, total calculation, and user info form
    - Open modal when user clicks "Vote" on a product card
    - Vote quantity selector (1–50) with +/- buttons or input
    - Display calculated total: `quantity × minAmount` updated in real-time
    - User info form: name, email, phone with client-side validation (email format, 10-digit phone)
    - Display specific validation errors for invalid fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.3 Integrate Razorpay checkout and payment verification flow
    - Include Razorpay `checkout.js` script
    - On form submit: call `POST https://api.choosepure.in/api/polls/vote` to create order
    - Open Razorpay checkout modal pre-filled with user name, email, phone
    - On payment success: call `POST https://api.choosepure.in/api/polls/verify-payment` with payment details
    - Display success message with votes cast and updated total vote count
    - Handle payment cancellation: display "Payment was cancelled. Your votes were not recorded."
    - Handle payment failure: display error message
    - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.9_

  - [x] 7.4 Add analytics tracking to `polling.html`
    - Add GA4, Meta Pixel, and Mixpanel initialization scripts (same IDs as index.html)
    - Fire page view event on load
    - Fire custom event on vote payment initiation (product name, vote count, amount)
    - Fire purchase/conversion event on successful payment (transaction value)
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Wire everything together and add routing
  - [x] 8.1 Add route for `polling.html` in `server.js` and update `vercel.json`
    - Add `app.get('/polling', ...)` route in `server.js` to serve `polling.html`
    - Update `vercel.json` rewrites if needed for the polling page route
    - _Requirements: 3.1_

  - [x] 8.2 Add navigation link to polling page from `index.html`
    - Add a CTA button or link on the landing page directing users to `/polling`
    - _Requirements: 3.1_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library for JavaScript
- Checkpoints ensure incremental validation
- All API calls from `polling.html` go to `https://api.choosepure.in` (cross-origin, credentials included)
- Razorpay keys are already configured in `.env`
