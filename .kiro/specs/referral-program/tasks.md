# Implementation Plan: Referral Program

## Overview

Implement a referral program for ChoosePure that assigns unique referral codes to users, tracks referral relationships, and rewards both referrer and referee with one free month of subscription upon the referee's first payment. Changes span `server.js` (backend), `purity-wall.html` (user frontend), and `admin.html` (admin frontend).

## Tasks

- [x] 1. Set up MongoDB collections, indexes, and helper functions
  - [x] 1.1 Create `referrals` and `rewards` collection references in the `connectToDatabase` function in `server.js`
    - Add `referralsCollection` and `rewardsCollection` variables alongside existing collection variables
    - Assign them in `connectToDatabase` after DB connection
    - Create indexes: unique index on `users.referral_code`, indexes on `referrals.referrer_user_id`, `referrals.referee_user_id`, and a unique compound index on `{ referrer_user_id: 1, referee_user_id: 1 }`
    - Create index on `rewards.user_id`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 1.2 Implement `generateReferralCode` helper function in `server.js`
    - Use `crypto.randomBytes` to generate 5 random uppercase alphanumeric characters
    - Format as `CP-XXXXX`
    - Retry up to 5 times on duplicate key collision
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Implement `extendSubscriptionExpiry` helper function in `server.js`
    - If current `subscriptionExpiry` exists and is in the future, add 1 calendar month to it
    - If null or in the past, add 1 calendar month to `new Date()`
    - Increment `freeMonthsEarned` on the user document
    - _Requirements: 4.4, 5.1, 5.2, 5.3_

  - [ ]* 1.4 Write property test for referral code format (Property 1)
    - **Property 1: Referral code format**
    - Verify generated codes match `/^CP-[A-Z0-9]{5}$/` across 100+ random invocations
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.5 Write property test for free month stacking (Property 7)
    - **Property 7: Free months stack cumulatively from current expiry**
    - Generate random start dates and N rewards, verify cumulative expiry equals N months added to original date
    - **Validates: Requirements 4.4, 5.1, 5.2, 5.3**

- [x] 2. Modify registration endpoint to support referral codes
  - [x] 2.1 Modify `POST /api/user/register` in `server.js`
    - Accept optional `referral_code` field in request body
    - If `referral_code` provided: validate it exists in users collection, check not self-referral (same email or phone), look up referrer user
    - On valid referral: set `referred_by` to referrer's `_id`, create referral record with status `"pending"` and `reward_granted: false`
    - Generate a unique `referral_code` for the new user using `generateReferralCode`
    - Initialize `freeMonthsEarned: 0` and `subscriptionExpiry: null` on the new user document
    - Return `referral_code` in the success response
    - If referral code invalid: return 400 with "Invalid referral code"
    - If self-referral: return 400 with "Cannot use own referral code"
    - Allow registration without referral code (field is optional)
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_

  - [ ]* 2.2 Write property test for valid referral registration (Property 3)
    - **Property 3: Valid referral registration creates correct referral state**
    - Generate referrer + referee pairs, verify `referred_by` and referral record state
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.3 Write property test for invalid referral code rejection (Property 4)
    - **Property 4: Invalid referral codes are rejected**
    - Generate non-existent codes and self-referral scenarios, verify rejection
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 2.4 Write property test for phone uniqueness (Property 9)
    - **Property 9: Phone number uniqueness prevents duplicate registration**
    - Generate existing phone + new registration attempt, verify rejection
    - **Validates: Requirements 7.3, 7.4**

- [x] 3. Modify login endpoint for referral code backfill
  - [x] 3.1 Modify `POST /api/user/login` in `server.js`
    - After successful authentication, check if user has a `referral_code`
    - If not, generate one using `generateReferralCode` and update the user document
    - Return `referral_code` in the login response
    - _Requirements: 1.4_

- [x] 4. Checkpoint - Verify registration and login changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Modify payment verification to trigger referral rewards
  - [x] 5.1 Modify `POST /api/subscription/verify-payment` in `server.js`
    - After existing Razorpay signature verification and subscription status update
    - Look up pending referral record where `referee_user_id` equals the current user
    - If found and `reward_granted` is false: update referral to `status: "completed"`, `reward_granted: true`, `completed_at: new Date()`
    - Create reward record for referrer: `{ user_id: referrer_id, reward_type: "referral", months: 1, source: referee_id, created_at: new Date() }`
    - Create reward record for referee: `{ user_id: referee_id, reward_type: "referral_signup", months: 1, source: referrer_id, created_at: new Date() }`
    - Call `extendSubscriptionExpiry` for both referrer and referee
    - Skip reward logic if referral already completed (idempotency)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

  - [ ]* 5.2 Write property test for subscription verification reward granting (Property 5)
    - **Property 5: Subscription verification completes referral and grants rewards**
    - Generate referee with pending referral, verify completion and reward records
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 5.3 Write property test for reward idempotency (Property 6)
    - **Property 6: Reward idempotency**
    - Generate completed referral, re-trigger verify-payment, verify no duplicate rewards
    - **Validates: Requirements 4.5, 7.5**

- [x] 6. Implement referral stats and admin endpoints
  - [x] 6.1 Modify `GET /api/user/me` in `server.js`
    - Include `referral_code`, `freeMonthsEarned`, and `subscriptionExpiry` in the response
    - _Requirements: 2.1_

  - [x] 6.2 Implement `GET /api/user/referral-stats` in `server.js`
    - Require user authentication (existing JWT middleware)
    - Query `referrals` collection for records where `referrer_user_id` equals the current user
    - Return `referral_code`, `referral_link`, `total_invited`, `completed`, `pending`, `free_months_earned`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.3 Implement `GET /api/admin/referral-overview` in `server.js`
    - Require admin authentication
    - Return `total_referrals` (count of all referral docs), `completed_referrals` (count with status "completed"), `total_free_months_granted` (sum of reward months)
    - _Requirements: 9.1_

  - [x] 6.4 Implement `GET /api/admin/referrals` in `server.js`
    - Require admin authentication
    - Return referral records with referrer name, referee name, status, reward_granted, created_at
    - Join with users collection to get names
    - _Requirements: 9.2_

  - [ ]* 6.5 Write property test for referral stats accuracy (Property 8)
    - **Property 8: Referral stats accuracy**
    - Generate M referrals with random statuses, verify stats counts match
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 6.6 Write property test for admin overview counts (Property 10)
    - **Property 10: Admin overview counts match records**
    - Generate referral/reward records, verify admin overview aggregates
    - **Validates: Requirements 9.1**

- [x] 7. Checkpoint - Verify all backend endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend: Registration form referral code support
  - [x] 8.1 Add referral code input field to registration form in `purity-wall.html`
    - Add optional "Referral Code" input (`id="auth-register-referral"`) below the password field
    - On page load, extract `ref` query parameter from URL and pre-fill the field
    - Include `referral_code` in the registration POST request body
    - _Requirements: 2.3, 3.5_

  - [ ]* 8.2 Write property test for referral link round-trip (Property 2)
    - **Property 2: Referral link round-trip**
    - Generate random valid referral codes, construct URL, extract `ref` param, verify round-trip
    - **Validates: Requirements 2.1, 2.3**

- [x] 9. Frontend: Referral dashboard on purity wall
  - [x] 9.1 Add referral dashboard section to `purity-wall.html`
    - Add new section between voting and suggest sections, visible only to authenticated users
    - Display referral code, referral link with copy button, and stats cards (total invited, successful, pending, free months)
    - Fetch data from `GET /api/user/referral-stats` on page load (when authenticated)
    - Show encouraging prompt when user has zero referrals
    - Copy button uses `navigator.clipboard.writeText()` with "Copied!" confirmation
    - Handle errors gracefully (hide section on network failure)
    - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Frontend: Admin referrals tab
  - [x] 10.1 Add Referrals tab to `admin.html`
    - Add a new "Referrals" tab in the admin navigation
    - Display referral overview stats (total, completed, free months granted) from `GET /api/admin/referral-overview`
    - Display referral records table (referrer name, referee name, status, reward, date) from `GET /api/admin/referrals`
    - _Requirements: 9.1, 9.2_

- [x] 11. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All backend changes are in `server.js`, frontend changes in `purity-wall.html` and `admin.html`
