# Implementation Plan: Annual Subscription

## Overview

Add annual billing (₹2,499/year) alongside the existing monthly plan (₹299/month). Changes span server.js (backend API), purity-wall.html (subscription modal + header), and index.html (landing page pricing). The implementation is incremental: backend plan support first, then frontend plan toggle, then webhook enhancements, and finally wiring everything together.

## Tasks

- [x] 1. Backend: Add plan parameter to create-order and verify-payment
  - [x] 1.1 Update `/api/subscription/create-order` to accept `plan` parameter
    - Add `plan` from `req.body`, default to `"monthly"` if missing
    - Validate `plan` is `"monthly"` or `"annual"`, return 400 for invalid values
    - Resolve `plan_id` from `RAZORPAY_PLAN_ID` (monthly) or `RAZORPAY_ANNUAL_PLAN_ID` (annual)
    - Return 503 if annual selected but `RAZORPAY_ANNUAL_PLAN_ID` is not set
    - Set `total_count: 12` for monthly, `total_count: 1` for annual
    - Include `plan` in the response JSON
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3_

  - [x] 1.2 Update `/api/subscription/verify-payment` to record plan type
    - Read `plan` from `req.body`, default to `"monthly"`
    - Set `subscriptionPlan` on the user document alongside `subscriptionStatus`
    - Record `plan` and correct `amount` (299 for monthly, 2499 for annual) in the subscription transaction
    - Existing referral reward logic remains unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.3 Update `/api/user/me` to include `subscriptionPlan`
    - Add `subscriptionPlan` to the `authenticateUser` middleware's `req.user` object
    - Include `subscriptionPlan` in the `/api/user/me` response
    - _Requirements: 10.1_

  - [ ]* 1.4 Write property test for invalid plan type rejection (Property 1)
    - **Property 1: Invalid plan types are rejected**
    - Generate random strings that are not "monthly" or "annual", verify 400 rejection
    - Use fast-check library
    - **Validates: Requirements 3.3**

- [x] 2. Backend: Webhook grace period and invoice email
  - [x] 2.1 Add grace period logic to `subscription.charged` failure handling
    - In the webhook handler, when `subscription.charged` event has a failed payment (or `payment.failed` event), find the user by `razorpaySubscriptionId` and set `graceDeadline` to `now + 3 days`
    - When a successful `subscription.charged` arrives, clear `graceDeadline` (set to `null`) on the user document
    - _Requirements: 5.1, 5.4_

  - [x] 2.2 Update `authenticateSubscribedUser` middleware for grace period
    - If `subscriptionStatus` is `"expired"` but `graceDeadline` exists and is in the future, treat user as subscribed
    - If `graceDeadline` has passed, set `subscriptionStatus` to `"expired"` and clear `graceDeadline` (lazy evaluation)
    - _Requirements: 5.2, 5.3_

  - [x] 2.3 Add invoice email on successful `subscription.charged` webhook
    - After updating `lastChargedAt`, send an invoice email via Mailgun with: payment amount, payment date, plan type, Razorpay payment ID, and next billing date
    - Read `subscriptionPlan` from the user document to determine plan type and calculate next billing date (1 month for monthly, 1 year for annual)
    - Fire-and-forget: log errors but do not block the webhook response
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.4 Write property test for grace deadline calculation (Property 2)
    - **Property 2: Grace deadline is exactly 3 calendar days from failure**
    - Generate random timestamps, verify graceDeadline = timestamp + 72 hours
    - Use fast-check library
    - **Validates: Requirements 5.1**

  - [ ]* 2.5 Write property test for grace period access control (Property 3)
    - **Property 3: Grace period access control is date-consistent**
    - Generate random (graceDeadline, currentDate) pairs, verify access iff currentDate < graceDeadline
    - Use fast-check library
    - **Validates: Requirements 5.2, 5.3**

- [x] 3. Backend: Startup validation for annual plan environment variable
  - Add a check after Razorpay client initialization in server.js
  - If `RAZORPAY_ANNUAL_PLAN_ID` is set, log: `"✅ RAZORPAY_ANNUAL_PLAN_ID configured"`
  - If not set, log: `"⚠️ RAZORPAY_ANNUAL_PLAN_ID not set — annual subscriptions unavailable"`
  - _Requirements: 8.1, 8.2_

- [x] 4. Checkpoint
  - Ensure all backend changes compile and the server starts without errors, ask the user if questions arise.

- [x] 5. Frontend: Subscription modal plan toggle (purity-wall.html)
  - [x] 5.1 Add plan toggle UI to the subscription modal
    - Insert two radio-style toggle buttons ("Monthly ₹299/mo" and "Annual ₹2,499/yr") above the subscribe button inside the `.sub-modal`
    - Add a "Save ~30%" green badge next to the annual option
    - Default selection to Annual
    - Add CSS styles for the plan toggle, active state, and savings badge
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Update `handleSubscribe()` and dynamic text
    - Read the selected plan from the toggle when subscribe button is clicked
    - Update subscribe button text dynamically: "Subscribe for ₹299/month" (monthly) or "Subscribe for ₹2,499/year" (annual)
    - Update note text: "MONTHLY ACCESS • CANCEL ANYTIME" (monthly) or "ANNUAL ACCESS • SAVE ~30%" (annual)
    - Pass `plan` parameter to the `create-order` fetch call and `verify-payment` fetch call
    - Update Razorpay checkout `description` to reflect the selected plan
    - On payment cancel/failure, restore button text to match the currently selected plan
    - _Requirements: 1.4, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.3 Display plan type in purity-wall header
    - After fetching `/api/user/me`, read `subscriptionPlan` from the response
    - Display "Premium · Monthly" or "Premium · Annual" next to the user avatar when subscribed
    - _Requirements: 10.2_

- [x] 6. Frontend: Landing page pricing toggle (index.html)
  - [x] 6.1 Add plan toggle to the Premium pricing card
    - Insert a toggle switch above the Premium card price in the membership/pricing section
    - Default to Annual view
    - Add CSS styles for the toggle switch
    - _Requirements: 2.1_

  - [x] 6.2 Implement dynamic price display based on toggle
    - When Annual is selected: show "₹2,499/year" with a "Save ~30%" badge
    - When Monthly is selected: show "₹299/month" without a savings badge
    - The Free Community card remains unchanged
    - _Requirements: 2.2, 2.3_

- [x] 7. Final checkpoint
  - Ensure all changes work together end-to-end: plan toggle in modal sends correct plan to backend, verify-payment records plan, /api/user/me returns plan, header displays plan type, landing page toggle works.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses JavaScript (Node.js/Express), so all code changes are in that language
- Property tests use the [fast-check](https://github.com/dubzzz/fast-check) library
- Refund policy page update (Requirement 7.3) and pro-rata refund calculation (Requirement 7.2) are manual/admin processes not covered by coding tasks
- No new collections are introduced; existing `users` and `subscription_transactions` collections receive additional fields
