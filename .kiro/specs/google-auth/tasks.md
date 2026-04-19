# Implementation Plan: Google Authentication

## Overview

This plan implements Google Sign-In as an alternative authentication method for the ChoosePure web application. The implementation follows an incremental approach: backend endpoints first, then frontend integration on both pages, followed by UI adjustments and analytics. Each task builds on the previous one, ensuring no orphaned code.

## Tasks

- [x] 1. Install google-auth-library and add backend Google auth endpoint
  - [x] 1.1 Install `google-auth-library` npm package and add `GET /api/config/google-client-id` endpoint
    - Run `npm install google-auth-library`
    - Add `const { OAuth2Client } = require('google-auth-library');` to server.js imports
    - Create `GET /api/config/google-client-id` endpoint that reads `GOOGLE_CLIENT_ID` from `process.env`
    - Return `{ clientId }` on success, or 503 with `"Google authentication is not configured"` if env var is not set
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Implement `POST /api/user/google-auth` endpoint with token verification and user lookup
    - Create the endpoint in server.js
    - Check `GOOGLE_CLIENT_ID` is set, return 503 if not
    - Use `OAuth2Client.verifyIdToken()` with `audience` set to `GOOGLE_CLIENT_ID` to verify the `credential` from the request body
    - Extract `email`, `name`, `sub`, `email_verified` from the token payload
    - Return 401 with `"Invalid Google token"` if verification fails
    - Return 400 with `"Google account email is not verified"` if `email_verified` is not true
    - Look up user by email in `usersCollection`
    - If user exists with `auth_provider: "google"` (or matching `google_id`): update `last_login`, generate JWT, set `user_token` cookie (7-day expiry), return user profile with `isNewUser: false`
    - If user exists with `auth_provider: "email"` (or no `auth_provider` field, indicating legacy email user): return 409 with `"This email is registered with email/password. Please sign in with your password."`
    - If no user exists: auto-register by creating a new user document with `auth_provider: "google"`, `google_id` from `sub`, `password: null`, `phone: null`, `pincode: null`, `role: "user"`, `subscriptionStatus: "free"`, generated `referral_code` (using existing `generateReferralCode`), `createdAt` timestamp. Generate JWT, set `user_token` cookie, return user profile with `isNewUser: true`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 11.2, 11.3_

  - [x] 1.3 Add referral code handling to the Google auth endpoint
    - When `referral_code` is provided in the request body and the user is being auto-registered:
      - Validate the referral code against `usersCollection`
      - If valid and belongs to a different email: set `referred_by` on the new user document and create a referral record in `referralsCollection` with `status: "pending"` and `reward_granted: false`
      - If invalid: proceed with registration without referral
      - If self-referral (same email): ignore the referral code
    - When the user already exists: ignore the `referral_code` parameter
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 1.4 Write property tests for Google auth endpoint (Properties 1–5)
    - Install `fast-check` as a dev dependency
    - Set up test file with mocked `google-auth-library` and mocked MongoDB collections
    - **Property 1: Token verification extracts correct payload**
    - **Validates: Requirements 2.1, 2.2**
    - **Property 2: Auto-registration creates correct user document**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 3: Existing Google user sign-in succeeds**
    - **Validates: Requirements 4.1, 4.3, 11.3**
    - **Property 4: Email/password user rejection on Google sign-in**
    - **Validates: Requirements 4.2, 11.2**
    - **Property 5: Referral application during Google registration**
    - **Validates: Requirements 5.1, 5.2**

- [x] 2. Checkpoint - Verify backend endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add profile update endpoint and modify existing endpoints
  - [x] 3.1 Create `PUT /api/user/profile` endpoint for profile completion
    - Protect with `authenticateUser` middleware
    - Accept `phone` and `pincode` fields in the request body
    - Validate phone as exactly 10 digits (`/^[0-9]{10}$/`) and pincode as exactly 6 digits (`/^[0-9]{6}$/`)
    - Check phone uniqueness against `usersCollection` (exclude current user)
    - Return 400 with appropriate messages for validation failures or duplicate phone
    - On success, update the user document with the new phone and pincode values
    - Return `{ success: true, message: "Profile updated successfully" }`
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 3.2 Modify `GET /api/user/me` to include `auth_provider` in the response
    - Add `auth_provider` to the `authenticateUser` middleware's `req.user` object (read from the user document, default to `"email"` if not set)
    - Include `auth_provider` in the `/api/user/me` response JSON
    - _Requirements: 9.2_

  - [x] 3.3 Modify `POST /api/user/forgot-password` to reject Google users
    - After finding the user by email, check if `auth_provider` is `"google"`
    - If so, return 400 with `"This account uses Google sign-in. Please sign in with Google."`
    - Existing email/password flow remains unchanged
    - _Requirements: 9.3_

  - [ ]* 3.4 Write property tests for profile update and forgot-password modifications (Properties 6–8)
    - **Property 6: Phone and pincode validation**
    - **Validates: Requirements 8.2**
    - **Property 7: Phone uniqueness enforcement**
    - **Validates: Requirements 8.3**
    - **Property 8: Google user password reset rejection**
    - **Validates: Requirements 9.3**

- [x] 4. Checkpoint - Verify all backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate Google Sign-In on the Landing Page (index.html)
  - [x] 5.1 Add GIS library script tag and Google button containers to index.html
    - Add `<script src="https://accounts.google.com/gsi/client" async defer></script>` in the `<head>`
    - Add a Google button container `<div>` and an "or" divider above the email/password fields in both the Sign In and Register tabs of the auth modal
    - Add CSS for `.google-btn-container` and `.auth-divider` styling
    - _Requirements: 1.1, 1.3, 1.4, 1.6_

  - [x] 5.2 Add GIS initialization and Google auth callback logic to index.html
    - On page load, fetch `GET /api/config/google-client-id` from the API
    - Call `google.accounts.id.initialize({ client_id, callback: handleGoogleAuth })` with the fetched client ID
    - Render the Google button into each tab's container using `google.accounts.id.renderButton()`
    - Implement `handleGoogleAuth(response)` callback:
      - Show loading state in the Google button area
      - Send `POST /api/user/google-auth` with `{ credential: response.credential, referral_code }` (referral code from URL params if present)
      - On success: call `updateAuthHeader(data.user)`, close modal
      - On error: display error message in the active tab's error area
    - Handle GIS library load failure gracefully (Google button area stays empty, email/password auth unaffected)
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 7.4_

  - [x] 5.3 Add analytics tracking for Google auth events on index.html
    - On successful auto-registration (`isNewUser: true`): fire "User Registered" event to GA4, Meta Pixel, and Mixpanel with `method: "google"`
    - On successful sign-in (`isNewUser: false`): fire "User Signed In" event to GA4, Meta Pixel, and Mixpanel with `method: "google"`
    - On error from the Google auth endpoint: fire "Google Auth Failed" event to Mixpanel with the error message
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 6. Integrate Google Sign-In on the Dashboard Page (purity-wall.html)
  - [x] 6.1 Add GIS library script tag and Google button containers to purity-wall.html
    - Add `<script src="https://accounts.google.com/gsi/client" async defer></script>` in the `<head>`
    - Add a Google button container `<div>` and an "or" divider above the email/password fields in both the Sign In and Register tabs of the auth modal
    - Reuse the same CSS classes (`.google-btn-container`, `.auth-divider`) as index.html
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [x] 6.2 Add GIS initialization and Google auth callback logic to purity-wall.html
    - Same pattern as index.html: fetch client ID, initialize GIS, render buttons, implement `handleGoogleAuth` callback
    - On success: call `updateAuthHeader(data.user)`, close modal, handle `pendingSubscribeAfterAuth` if set
    - On error: display error message in the active tab's error area
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.4_

  - [x] 6.3 Add analytics tracking for Google auth events on purity-wall.html
    - Same analytics events as index.html: "User Registered", "User Signed In", "Google Auth Failed"
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 7. Checkpoint - Verify Google Sign-In flow on both pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add profile completion banner and UI adjustments for Google users
  - [x] 8.1 Add profile completion banner to purity-wall.html
    - Add a non-blocking, dismissible banner below the welcome banner that shows when `currentUser.phone === null`
    - Banner contains inline inputs for phone (10 digits) and pincode (6 digits) with a submit button
    - On submit, call `PUT /api/user/profile` with the phone and pincode values
    - On success, hide the banner and update `currentUser` with the new phone/pincode
    - On error, display the error message inline in the banner
    - User can still browse reports and access subscription features while banner is shown
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 8.2 Hide "Forgot Password?" link for Google users on purity-wall.html
    - After fetching `/api/user/me`, check if `auth_provider` is `"google"`
    - If so, hide the "Forgot Password?" link in the auth modal (it won't be visible since the user is already signed in, but ensure it's hidden if the modal is somehow shown)
    - Also hide the forgot password link on index.html for consistency when `auth_provider` is `"google"` in the session
    - _Requirements: 9.1, 9.2_

  - [ ]* 8.3 Write unit tests for frontend UI adjustments
    - Test that profile completion banner shows for Google users with `phone: null`
    - Test that profile completion banner is hidden for users with a phone number
    - Test that forgot password link is hidden for Google users
    - Test that Google button renders in both Sign In and Register tabs
    - Test that error messages display correctly in the auth modal
    - _Requirements: 8.1, 9.1, 1.1, 1.2, 6.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `google-auth-library` package is used for backend token verification (no direct calls to Google's tokeninfo endpoint)
- Existing users without `auth_provider` field are treated as `"email"` users (backward compatible, no migration needed)
- The `GOOGLE_CLIENT_ID` environment variable must be set in the Render deployment settings before the feature goes live
