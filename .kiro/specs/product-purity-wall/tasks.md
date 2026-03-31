# Implementation Plan: Product Purity Wall

## Overview

Implement a subscription-gated purity wall page with product test report cards, Razorpay subscription payment, deep-dive report pages with PDF download, and admin report management. The implementation extends the existing server.js, adds two new HTML pages, and extends admin.html.

## Tasks

- [x] 1. Set up MongoDB collections and server-side data layer
  - [x] 1.1 Add `test_reports` and `subscription_transactions` collection references in server.js `connectToDatabase()`
    - Initialize `testReportsCollection` and `subscriptionTransactionsCollection` variables alongside existing collection refs
    - Create indexes: `{ published: 1, createdAt: -1 }` and `{ category: 1 }` on `test_reports`
    - Create indexes: `{ userId: 1 }` and `{ createdAt: -1 }` on `subscription_transactions`
    - _Requirements: 1.1, 4.3, 8.3_

  - [x] 1.2 Add `subscriptionStatus` field to user registration endpoint
    - Modify `POST /api/user/register` to include `subscriptionStatus: 'free'` in the inserted user document
    - _Requirements: 9.1_

  - [x] 1.3 Update `GET /api/user/me` to include `subscriptionStatus`
    - Fetch full user document in `authenticateUser` middleware (include `subscriptionStatus`)
    - Return `subscriptionStatus` in the `/api/user/me` response
    - _Requirements: 9.2_

  - [x] 1.4 Add `authenticateSubscribedUser` middleware
    - Extend `authenticateUser` to also check `subscriptionStatus === 'subscribed'`
    - Return 403 with `{ success: false, message: "Subscription required", redirect: "/purity-wall" }` if not subscribed
    - _Requirements: 7.5, 13_

  - [ ]* 1.5 Write property test: new user defaults to free subscription (Property 16)
    - **Property 16: New user registration defaults to free subscription**
    - **Validates: Requirements 9.1**

  - [ ]* 1.6 Write property test: user me endpoint includes subscription status (Property 17)
    - **Property 17: User me endpoint includes subscription status**
    - **Validates: Requirements 9.2**

- [x] 2. Implement admin test report CRUD endpoints
  - [x] 2.1 Implement `POST /api/admin/reports` — create test report
    - Validate required fields: productName, brandName, category, imageUrl, purityScore, testParameters
    - Validate purityScore is between 0 and 10
    - Insert document with `published: true`, `createdAt`, `updatedAt` timestamps
    - Protected by `authenticateAdmin` middleware
    - _Requirements: 8.3_

  - [x] 2.2 Implement `GET /api/admin/reports` — list all reports (including unpublished)
    - Return all test reports sorted by `createdAt` descending
    - Protected by `authenticateAdmin` middleware
    - _Requirements: 8.4_

  - [x] 2.3 Implement `PUT /api/admin/reports/:id` — update test report
    - Validate purityScore range if provided
    - Update `updatedAt` timestamp
    - Return 404 if report not found
    - Protected by `authenticateAdmin` middleware
    - _Requirements: 8.5_

  - [x] 2.4 Implement `DELETE /api/admin/reports/:id` — delete test report
    - Return 404 if report not found
    - Protected by `authenticateAdmin` middleware
    - _Requirements: 8.6_

  - [ ]* 2.5 Write property test: CRUD round-trip (Property 14)
    - **Property 14: Test report CRUD round-trip**
    - **Validates: Requirements 8.3, 8.5**

  - [ ]* 2.6 Write property test: deletion removes from public listing (Property 15)
    - **Property 15: Test report deletion removes from public listing**
    - **Validates: Requirements 8.6**

- [x] 3. Implement public reports and deep-dive API endpoints
  - [x] 3.1 Implement `GET /api/reports` — public reports listing
    - Return published reports sorted by `createdAt` descending
    - If user is subscribed (check optional JWT), return full data including purityScore for all reports
    - If user is not subscribed or unauthenticated, return purityScore only for the first report, omit/mask for the rest
    - Always return productName, brandName, category, imageUrl, statusBadges
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 5.1, 5.2_

  - [x] 3.2 Implement `GET /api/reports/:id` — full report for deep-dive
    - Protected by `authenticateSubscribedUser` middleware
    - Return full test report including testParameters, expertCommentary, purityScore
    - Return 404 if report not found or not published
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.3 Implement `GET /api/reports/:id/pdf` — PDF report download
    - Protected by `authenticateSubscribedUser` middleware
    - Install and use `pdfkit` to generate PDF with product name, purity score, test parameters, expert commentary
    - Set `Content-Type: application/pdf` and `Content-Disposition` headers
    - _Requirements: 7.4_

  - [ ]* 3.4 Write property test: published reports returned newest-first (Property 1)
    - **Property 1: Published reports are returned newest-first**
    - **Validates: Requirements 1.1**

  - [ ]* 3.5 Write property test: card rendering includes all required fields (Property 2)
    - **Property 2: Card rendering includes all required fields**
    - **Validates: Requirements 1.2, 5.2**

  - [ ]* 3.6 Write property test: card locking based on subscription status (Property 3)
    - **Property 3: Card locking based on subscription status**
    - **Validates: Requirements 2.1, 2.2, 5.1**

  - [ ]* 3.7 Write property test: non-subscribed users cannot access deep-dive (Property 13)
    - **Property 13: Non-subscribed users cannot access deep-dive reports**
    - **Validates: Requirements 7.5**

  - [ ]* 3.8 Write property test: deep-dive returns complete report data (Property 11)
    - **Property 11: Deep-dive API returns complete report data**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 3.9 Write property test: PDF generation returns valid PDF (Property 12)
    - **Property 12: PDF generation returns valid PDF with report data**
    - **Validates: Requirements 7.4**

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement subscription payment endpoints
  - [x] 5.1 Implement `POST /api/subscription/create-order`
    - Protected by `authenticateUser` middleware
    - Check user is not already subscribed (return 400 if so)
    - Create Razorpay order for 29900 paise (₹299)
    - Return `{ orderId, amount, key: RAZORPAY_KEY_ID }`
    - _Requirements: 4.1_

  - [x] 5.2 Implement `POST /api/subscription/verify-payment`
    - Protected by `authenticateUser` middleware
    - Validate required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature
    - Verify HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`
    - On success: update user `subscriptionStatus` to `subscribed`, set `subscribedAt`, insert `subscription_transaction` record
    - On failure: return 400 error, do not change user status
    - _Requirements: 4.2, 4.3, 4.5_

  - [ ]* 5.3 Write property test: subscription order amount is always ₹299 (Property 5)
    - **Property 5: Subscription order amount is always ₹299**
    - **Validates: Requirements 4.1**

  - [ ]* 5.4 Write property test: payment signature verification (Property 6)
    - **Property 6: Payment signature verification**
    - **Validates: Requirements 4.2**

  - [ ]* 5.5 Write property test: subscription status changes iff payment succeeds (Property 7)
    - **Property 7: Subscription status changes if and only if payment succeeds**
    - **Validates: Requirements 4.3, 4.5**

- [x] 6. Build purity-wall.html page
  - [x] 6.1 Create purity-wall.html with page structure and styles
    - Header matching existing site nav (logo, links, auth section)
    - Conditional header text: "See how your milk compares" (non-subscribed) / "Your Purity Dashboard" (subscribed)
    - Search bar + category filter (disabled for non-subscribed, enabled for subscribed)
    - Responsive product card grid (min 300px card width)
    - Empty state message when no reports exist
    - Reuse existing CSS variables and auth modal patterns from polling.html
    - _Requirements: 1.2, 1.3, 1.4, 2.3, 2.4, 5.3, 5.4_

  - [x] 6.2 Implement card rendering logic with lock/unlock states
    - Fetch `GET /api/reports` on page load
    - Check user subscription status via `GET /api/user/me`
    - First card unlocked for non-subscribed users (show purityScore, "View Full Lab Analysis" button)
    - Remaining cards locked for non-subscribed users (blurred score, 🔒 overlay)
    - All cards unlocked for subscribed users with status badges and "Download PDF Report" button
    - Purity score color coding: ≥7.0 green (#1F6B4E), 4.0-6.9 amber (#FFB703), <4.0 red (#D62828)
    - Score format: "X.X/10" in Roboto Mono font
    - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.5, 5.6, 10.1, 10.2, 10.3, 10.4_

  - [x] 6.3 Implement subscription modal and Razorpay payment flow
    - Show modal on locked card click with risk-based prompt (brand name, contaminant count, subscriber count)
    - "Unlock Now for ₹299" CTA button
    - If not logged in, show auth modal first, then proceed to payment
    - Call `POST /api/subscription/create-order`, open Razorpay checkout
    - On success: call `POST /api/subscription/verify-payment`, reload page
    - On cancel/dismiss: show cancellation message
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.4, 4.6_

  - [x] 6.4 Implement search and category filter functionality
    - Search input filters cards by brandName or category (case-insensitive)
    - Category dropdown filters by exact category match
    - Clearing filters restores full list
    - Filters only enabled for subscribed users
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.5 Write property test: search filter returns matching reports (Property 8)
    - **Property 8: Search filter returns matching reports (case-insensitive)**
    - **Validates: Requirements 6.1**

  - [ ]* 6.6 Write property test: category filter returns only matching category (Property 9)
    - **Property 9: Category filter returns only matching category**
    - **Validates: Requirements 6.2**

  - [ ]* 6.7 Write property test: clearing filters restores full list (Property 10)
    - **Property 10: Clearing filters restores full list**
    - **Validates: Requirements 6.3**

  - [ ]* 6.8 Write property test: purity score color mapping (Property 18)
    - **Property 18: Purity score color mapping**
    - **Validates: Requirements 10.2, 10.3, 10.4**

  - [ ]* 6.9 Write property test: purity score format (Property 19)
    - **Property 19: Purity score format**
    - **Validates: Requirements 10.1**

- [x] 7. Build deep-dive.html page
  - [x] 7.1 Create deep-dive.html with page structure and styles
    - Breadcrumb navigation (Products > Category > Product Name)
    - Product name, category, purity score circle (color-coded)
    - Test parameter sections with measured values and acceptable ranges
    - Expert commentary card (Dr. Aman Mann with photo)
    - Product image with batch code and shelf life
    - "Download PDF Report" button calling `GET /api/reports/:id/pdf`
    - Methodology note section
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Implement subscription gate and redirect logic
    - On page load, check subscription status via `GET /api/user/me`
    - If not subscribed or not authenticated, redirect to `/purity-wall` (the purity-wall page will show the subscription modal)
    - Fetch full report data via `GET /api/reports/:id`
    - _Requirements: 7.5, 9.3_

- [x] 8. Extend admin.html with test report management
  - [x] 8.1 Add "Test Reports" section to admin.html
    - Create report form: product name, brand name, category, image URL, purity score (0-10), test parameters (dynamic rows with name, measured value, acceptable range, status), expert commentary, status badges
    - List existing reports in a table with edit/delete actions
    - Inline editing support for existing reports
    - Wire form submission to `POST /api/admin/reports`
    - Wire edit to `PUT /api/admin/reports/:id` and delete to `DELETE /api/admin/reports/:id`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 8.2 Write property test: subscription modal content completeness (Property 4)
    - **Property 4: Subscription modal content completeness**
    - **Validates: Requirements 3.2**

- [x] 9. Wire static page routes in server.js
  - [x] 9.1 Add Express routes for new HTML pages
    - `GET /purity-wall` → serve `purity-wall.html`
    - `GET /deep-dive` → serve `deep-dive.html`
    - _Requirements: 1.1, 7.1_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` as the PBT library per the design document
- All backend endpoints are added to the existing `server.js` file
- Frontend pages reuse existing CSS variables, auth modal patterns, and header styles from polling.html/index.html
