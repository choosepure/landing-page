# Implementation Plan: User Authentication for Polling Page

## Overview

Add user registration, sign-in, session management, password reset, and authentication gating to the ChoosePure polling page. This involves adding 6 new API endpoints and an `authenticateUser` middleware in `server.js`, modifying 3 existing protected endpoints, adding an Auth Modal and auth header state to `polling.html`, creating a `user-reset-password.html` page, and auto-filling user details in the vote modal and suggestion form. Implementation uses JavaScript (Node.js/Express backend, vanilla JS frontend) mirroring the existing admin auth pattern.

## Tasks

- [x] 1. Add authenticateUser middleware and user auth endpoints in `server.js`
  - [x] 1.1 Create `authenticateUser` middleware in `server.js`
    - Mirror the existing `authenticateAdmin` middleware pattern
    - Read `user_token` from `req.cookies`, verify JWT with `JWT_SECRET`
    - Look up user in `usersCollection` by decoded ID with `role: "user"`
    - Attach `{ id, email, name, phone }` to `req.user`
    - Return 401 `{ success: false, message: "Authentication required" }` if cookie missing, JWT invalid/expired, or user not found
    - Add `{ email: 1 }` unique index and `{ role: 1 }` index on `usersCollection` in `connectToDatabase` if not already present
    - _Requirements: 8.4, 8.5, 3.3_

  - [x] 1.2 Implement `POST /api/user/register` endpoint
    - Validate required fields: name, email, phone, password
    - Validate email format (regex), phone (exactly 10 digits), password (≥ 8 chars)
    - Return 400 with specific error messages for each validation failure
    - Check email uniqueness in `usersCollection`; return 400 if duplicate
    - Hash password with `bcrypt.hash(password, 12)`
    - Insert user document with `role: "user"`, `createdAt: new Date()`
    - Generate JWT token with `{ id, email, role }`, set as `user_token` httpOnly cookie (7-day expiry)
    - Return `{ success: true, user: { name, email } }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 1.3 Write property test for registration round-trip (Property 1)
    - **Property 1: Registration round-trip**
    - **Validates: Requirements 1.1, 1.7**

  - [ ]* 1.4 Write property test for duplicate email rejection (Property 2)
    - **Property 2: Duplicate email rejection**
    - **Validates: Requirements 1.2**

  - [ ]* 1.5 Write property test for registration input validation (Property 3)
    - **Property 3: Registration input validation**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 1.6 Implement `POST /api/user/login` endpoint
    - Validate required fields: email, password; return 400 if missing
    - Find user in `usersCollection` with matching email and `role: "user"`
    - Verify password with `bcrypt.compare`; return 401 "Invalid credentials" on mismatch or user not found
    - Update `last_login` timestamp
    - Generate JWT token, set as `user_token` httpOnly cookie (7-day expiry)
    - Return `{ success: true, user: { name, email, phone } }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.7 Write property test for login round-trip (Property 4)
    - **Property 4: Login round-trip**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.8 Write property test for login rejects invalid credentials (Property 5)
    - **Property 5: Login rejects invalid credentials**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 1.9 Implement `POST /api/user/logout` endpoint
    - Clear the `user_token` cookie
    - Return `{ success: true, message: "Logged out successfully" }`
    - _Requirements: 4.2_

  - [x] 1.10 Implement `GET /api/user/me` endpoint
    - Protect with `authenticateUser` middleware
    - Return `{ success: true, user: { name, email, phone } }` from `req.user`
    - _Requirements: 3.1, 3.2_

  - [ ]* 1.11 Write property test for session check round-trip (Property 6)
    - **Property 6: Session check round-trip**
    - **Validates: Requirements 3.2**

  - [ ]* 1.12 Write property test for protected endpoints reject unauthenticated requests (Property 7)
    - **Property 7: Protected endpoints reject unauthenticated requests**
    - **Validates: Requirements 3.3, 8.1, 8.2, 8.3, 8.4**

- [x] 2. Add password reset endpoints and page
  - [x] 2.1 Implement `POST /api/user/forgot-password` endpoint
    - Accept `{ email }`, always return success response regardless of email existence
    - If user with `role: "user"` found: generate JWT reset token (1-hour expiry), store `reset_token` and `reset_token_expires` in user document
    - Send password reset email via Mailgun with link to `https://choosepure.in/user/reset-password?token=...`
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 2.2 Implement `POST /api/user/reset-password` endpoint
    - Accept `{ token, password }`
    - Validate password ≥ 8 characters
    - Verify JWT token, find user with matching `reset_token`
    - Check `reset_token_expires` not passed
    - Hash new password with bcrypt, update user document, clear reset token fields
    - Return 400 for invalid/expired tokens
    - _Requirements: 9.5, 9.6, 9.7_

  - [x] 2.3 Add `GET /user/reset-password` route in `server.js` and create `user-reset-password.html`
    - Create `user-reset-password.html` with new password + confirm password fields
    - Read `token` from URL query parameter
    - Call `POST /api/user/reset-password` on submit
    - Show success message with link back to polling page on success
    - Style consistently with existing `admin-reset-password.html`
    - _Requirements: 9.5_

  - [ ]* 2.4 Write property test for password reset round-trip (Property 10)
    - **Property 10: Password reset round-trip**
    - **Validates: Requirements 9.3, 9.6**

  - [ ]* 2.5 Write property test for forgot-password never reveals email existence (Property 11)
    - **Property 11: Forgot-password never reveals email existence**
    - **Validates: Requirements 9.4**

  - [ ]* 2.6 Write property test for invalid reset token rejection (Property 12)
    - **Property 12: Invalid reset token rejection**
    - **Validates: Requirements 9.7**

- [x] 3. Checkpoint - Ensure all backend endpoints work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Protect existing endpoints with authenticateUser middleware
  - [x] 4.1 Add `authenticateUser` middleware to `POST /api/polls/vote`
    - Use `req.user` for `userName`, `userEmail`, `userPhone` instead of request body
    - Add `userId` field (from `req.user.id`) to the vote transaction record
    - _Requirements: 8.1, 8.5_

  - [x] 4.2 Add `authenticateUser` middleware to `POST /api/suggestions`
    - Use `req.user` for `userName`, `userEmail` instead of request body
    - Add `userId` field to the suggestion record
    - _Requirements: 8.2, 8.5_

  - [x] 4.3 Add `authenticateUser` middleware to `POST /api/suggestions/:id/upvote`
    - Use `req.user.id` for upvote tracking
    - _Requirements: 8.3_

  - [ ]* 4.4 Write property test for authenticated actions record user identity (Property 8)
    - **Property 8: Authenticated actions record user identity**
    - **Validates: Requirements 8.5**

  - [ ]* 4.5 Write property test for public endpoints remain accessible (Property 9)
    - **Property 9: Public endpoints remain accessible without authentication**
    - **Validates: Requirements 5.5**

- [x] 5. Checkpoint - Ensure protected endpoints work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add Auth Modal and auth header to `polling.html`
  - [x] 6.1 Add Auth Header to the existing `.header-nav` in `polling.html`
    - Unauthenticated state: show "Sign In" link
    - Authenticated state: show "Hi, {name}" text and "Sign Out" link
    - Wire "Sign Out" to call `POST /api/user/logout` and reset UI state
    - Use brand styling (Deep Leaf Green, Inter font)
    - _Requirements: 4.1, 4.3, 6.6_

  - [x] 6.2 Build the Auth Modal overlay in `polling.html`
    - Add modal HTML with two tabs: "Sign In" (default) and "Register"
    - Sign In form: email, password fields, "Forgot Password?" link, "Sign In" button
    - Register form: name, email, phone, password fields, "Register" button
    - Forgot Password view: email field, "Send Reset Link" button, "Back to Sign In" link
    - Error message display area below each form
    - Loading state: disable submit button, show spinner text while request in progress
    - Style with Deep Leaf Green (#1F6B4E) buttons, Pure Ivory (#FAFAF7) background, Inter font, consistent border-radius matching existing modals
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 6.3 Implement Auth Modal JavaScript logic in `polling.html`
    - Tab switching between Sign In, Register, and Forgot Password views
    - Wire Sign In form to `POST /api/user/login`
    - Wire Register form to `POST /api/user/register`
    - Wire Forgot Password form to `POST /api/user/forgot-password`
    - On success: close modal, update auth header, store user data in `currentUser` variable
    - Display server error messages inline below the relevant form
    - Display "Network error. Please try again." on fetch failures
    - _Requirements: 1.8, 2.6, 9.2_

- [x] 7. Implement authentication gating and session persistence in `polling.html`
  - [x] 7.1 Add session check on page load
    - Call `GET /api/user/me` with credentials on page load
    - On success: set `currentUser`, update auth header, enable protected actions
    - On failure: silently set unauthenticated state (no error shown)
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 7.2 Implement auth gate for protected actions
    - When unauthenticated user clicks "Vote for This Product": open Auth Modal instead of vote modal, store `pendingAction = { type: 'vote', data: { productId } }`
    - When unauthenticated user clicks "Submit Suggestion": open Auth Modal, store `pendingAction = { type: 'suggest' }`
    - When unauthenticated user clicks upvote button: open Auth Modal, store `pendingAction = { type: 'upvote', data: { suggestionId } }`
    - After successful auth: replay the pending action automatically
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.3 Implement auto-fill of user details in vote modal and suggestion form
    - When `currentUser` is set: pre-fill vote modal name, email, phone fields
    - Make name and email fields read-only in vote modal when authenticated
    - Pre-fill suggestion form name (`sg-uname`) and email (`sg-email`) fields
    - Make suggestion form name and email fields read-only when authenticated
    - Allow phone field in vote modal to remain editable
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Add analytics tracking for auth events in `polling.html`
  - Track "User Registered" event to GA4, Meta Pixel, and Mixpanel on successful registration
  - Track "User Signed In" event to GA4, Meta Pixel, and Mixpanel on successful sign-in
  - Track "User Signed Out" event to Mixpanel on sign-out
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library for JavaScript/Node.js
- Checkpoints ensure incremental validation
- All API calls from `polling.html` use `credentials: 'include'` for cross-origin cookie handling
- The `authenticateUser` middleware mirrors the existing `authenticateAdmin` pattern
- User documents share the `users` collection with admin documents, distinguished by `role` field
