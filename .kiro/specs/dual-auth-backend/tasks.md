# Implementation Plan: Dual Auth Backend

## Overview

The dual authentication support (Bearer token + httpOnly cookie) is already implemented in `server.js`. This plan focuses on verifying the existing implementation against all requirements, fixing any minor gaps found during verification, confirming CORS behavior for mobile clients, and adding automated tests to lock down the dual-auth contract.

## Tasks

- [ ] 1. Verify auth middleware and auth endpoint responses against requirements
  - [ ] 1.1 Verify `authenticateUser` middleware handles Bearer token, cookie, and both-present cases
    - Read the `authenticateUser` function in `server.js`
    - Confirm it extracts Bearer token from `Authorization` header first (Requirement 1.1)
    - Confirm it falls back to `user_token` cookie when no Authorization header is present (Requirement 1.2)
    - Confirm Bearer token takes priority when both header and cookie are present (Requirement 1.3)
    - Confirm it returns 401 with `{ success: false, message: "Authentication required" }` when no token is found (Requirement 1.4)
    - Confirm it returns 401 when JWT verification fails (Requirement 1.5)
    - Confirm it returns 401 when decoded user is not found in the database (Requirement 1.6)
    - Confirm `req.user` is populated with all required fields: `id`, `email`, `name`, `phone`, `subscriptionStatus`, `referral_code`, `freeMonthsEarned`, `subscriptionExpiry`, `auth_provider` (Requirement 9.3)
    - Fix any discrepancies found
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.3_

  - [ ] 1.2 Verify `authenticateSubscribedUser` delegates to `authenticateUser` and checks subscription
    - Confirm it calls `authenticateUser` first, inheriting dual-auth support (Requirement 2.1)
    - Confirm it returns 403 with `{ success: false, message: "Subscription required" }` for non-subscribed users (Requirement 2.2)
    - Confirm it calls `next()` for subscribed or cancelled users (Requirement 2.3)
    - Fix any discrepancies found
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 1.3 Verify login, register, and Google auth endpoints return `token` in response body
    - Confirm `POST /api/user/login` returns `token` field in JSON body and sets `user_token` cookie (Requirements 3.1, 3.2)
    - Confirm the login response `user` object includes `name` field (per design spec)
    - Confirm `POST /api/user/register` returns `token` field in JSON body and sets `user_token` cookie (Requirements 4.1, 4.2)
    - Confirm `POST /api/user/google-auth` returns `token` field in JSON body and sets `user_token` cookie (Requirements 5.1, 5.2)
    - Confirm all JWTs contain `id`, `email`, `role` fields with 7-day expiry (Requirements 3.3, 4.3)
    - Fix any discrepancies found
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2_

  - [ ] 1.4 Verify reports list endpoint optional auth handles Bearer token and cookie
    - Read the `GET /api/reports` handler in `server.js`
    - Confirm it tries Bearer header first, then cookie for optional auth (Requirements 6.1, 6.2, 6.3)
    - Confirm subscribed users see `purityScore` on all reports (Requirements 6.1, 6.2)
    - Confirm unauthenticated requests see `purityScore` only on the first report (Requirement 6.4)
    - Confirm invalid tokens are treated as unauthenticated without returning an error (Requirement 6.5)
    - Fix any discrepancies found
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2. Verify CORS configuration allows mobile clients without Origin header
  - [ ] 2.1 Verify CORS config and document mobile client behavior
    - Read the CORS middleware configuration in `server.js`
    - Confirm the origin array includes `https://choosepure.in`, `https://www.choosepure.in`, `http://localhost:3000` with `credentials: true` (Requirement 7.1)
    - Confirm that the `cors` npm package with a static origin array does not reject requests lacking an `Origin` header (Requirements 7.2, 7.3)
    - If the CORS origin callback actively rejects requests without an Origin header, fix it to allow them through
    - Add a code comment near the CORS config documenting that React Native clients send no Origin header and are not blocked
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3. Verify logout and all authenticated endpoints
  - [ ] 3.1 Verify logout endpoint clears cookie correctly
    - Confirm `POST /api/user/logout` clears the `user_token` cookie (Requirement 8.1)
    - Confirm it responds with `{ success: true, message: "Logged out successfully" }` (Requirement 8.2)
    - Fix any discrepancies found
    - _Requirements: 8.1, 8.2_

  - [ ] 3.2 Verify all authenticated endpoints use `authenticateUser` or `authenticateSubscribedUser`
    - Confirm the following endpoints use `authenticateUser`: `GET /api/user/me`, `PUT /api/user/profile`, `POST /api/polls/vote`, `POST /api/polls/verify-payment`, `GET /api/user/referral-stats`, `GET /api/polls/free-vote-status`, `POST /api/polls/free-vote`, `POST /api/suggestions`, `POST /api/suggestions/:id/upvote`, `POST /api/subscription/create-order`, `POST /api/subscription/verify-payment`, `POST /api/subscription/cancel` (Requirement 9.1)
    - Confirm the following endpoints use `authenticateSubscribedUser`: `GET /api/reports/:id`, `GET /api/reports/:id/pdf` (Requirement 9.2)
    - Fix any endpoints that are missing the correct middleware
    - _Requirements: 9.1, 9.2_

- [ ] 4. Checkpoint - Verify all code changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Set up test framework and write dual-auth tests
  - [ ] 5.1 Set up Jest and Supertest test infrastructure
    - Install `jest`, `supertest`, and `fast-check` as dev dependencies
    - Add a `test` script to `package.json`
    - Create a `tests/` directory
    - Create a test helper that exports the Express app from `server.js` for Supertest (may require refactoring `server.js` to export `app` separately from `app.listen`)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.2 Write property tests for token extraction priority (Property 1)
    - Create `tests/auth-middleware.test.js`
    - **Property 1: Token extraction priority and user equivalence**
    - Generate arbitrary valid JWTs and request configurations (Bearer only, cookie only, both)
    - Assert that Bearer token is used when Authorization header is present, cookie is used otherwise
    - Assert that `req.user` fields are identical regardless of token source
    - **Validates: Requirements 1.1, 1.2, 1.3, 9.3**

  - [ ]* 5.3 Write property tests for invalid token rejection (Property 2)
    - Add to `tests/auth-middleware.test.js`
    - **Property 2: Invalid token rejection**
    - Generate arbitrary malformed, expired, and wrongly-signed token strings
    - Assert that all return HTTP 401 with `{ success: false, message: "Authentication required" }`
    - **Validates: Requirements 1.5**

  - [ ]* 5.4 Write property tests for auth endpoint token consistency (Property 3)
    - Create `tests/auth-endpoints.test.js`
    - **Property 3: Auth endpoint token consistency**
    - Generate arbitrary valid user registration and login data
    - Assert that response body contains `token` field with a valid JWT
    - Assert that `Set-Cookie` header contains `user_token` with the same JWT
    - Assert that decoded JWT contains `id`, `email`, `role` with 7-day expiry
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 4.3**

  - [ ]* 5.5 Write property tests for subscribed user report visibility (Property 4)
    - Create `tests/reports-auth.test.js`
    - **Property 4: Subscribed user report visibility**
    - Generate arbitrary sets of published reports and subscribed user tokens
    - Assert that every report in the response includes `purityScore` for subscribed users
    - Assert that only the first report includes `purityScore` for unauthenticated requests
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [ ]* 5.6 Write unit tests for CORS and logout behavior
    - Create `tests/cors.test.js` — test that requests without an Origin header are not rejected
    - Create `tests/logout.test.js` — test that logout clears the `user_token` cookie and returns the correct response
    - _Requirements: 7.2, 7.3, 8.1, 8.2_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The existing implementation in `server.js` already covers the core dual-auth functionality — these tasks verify correctness and add test coverage
- Property tests validate the four correctness properties defined in the design document
- CORS verification is critical for mobile app compatibility — React Native's native HTTP client does not send an Origin header
