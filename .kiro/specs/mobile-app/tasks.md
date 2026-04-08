# Implementation Plan: ChoosePure Mobile App

## Overview

Implement a React Native (Expo managed workflow) mobile application that mirrors the ChoosePure web platform. Work proceeds in phases: backend auth modifications, Expo project scaffolding, core modules (API client, auth context, theme, validation), navigation, auth screens, main screens, deep linking, and Razorpay integration. All code lives in the `mobile app/` folder except backend changes in `server.js`.

## Tasks

- [x] 1. Backend modifications for dual auth support
  - [x] 1.1 Update `authenticateUser` middleware in `server.js` to check `Authorization: Bearer` header before falling back to `user_token` cookie
    - Extract token from `req.headers.authorization` if present and starts with `Bearer `
    - Fall back to `req.cookies.user_token` if no header token
    - When both are present, prioritize the Authorization header
    - _Requirements: 15.1, 15.2_

  - [x] 1.2 Update login endpoint to return JWT token in response body
    - Add `token` field to the success response JSON of POST `/api/user/login`
    - Existing cookie-setting behavior must remain unchanged
    - _Requirements: 15.3_

  - [x] 1.3 Update register endpoint to return JWT token in response body
    - Add `token` field to the success response JSON of POST `/api/user/register`
    - Existing cookie-setting behavior must remain unchanged
    - _Requirements: 15.3_

  - [x] 1.4 Update optional auth check in GET `/api/reports` to support Authorization header
    - Apply the same dual-auth pattern (header first, cookie fallback) to the reports endpoint subscription check
    - _Requirements: 15.4_

  - [ ]* 1.5 Write property test for backend dual auth (Property 6)
    - **Property 6: Backend Dual Auth with Header Priority**
    - Generate random valid JWT tokens and test middleware with header-only, cookie-only, and both present scenarios
    - Verify header takes priority when both are present
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 15.1, 15.2**

- [x] 2. Checkpoint — Verify backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Expo project scaffolding in `mobile app/`
  - [x] 3.1 Initialize Expo project and configure `app.json`, `package.json`, `babel.config.js`
    - Set `expo.scheme` to `"choosepure"` for deep linking
    - Configure splash screen, app icon placeholders, and app name
    - Add all required dependencies: `expo`, `expo-dev-client`, `react-native-razorpay`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`, `axios`, `expo-linking`, `expo-clipboard`, `expo-sharing`, `expo-file-system`, `@expo-google-fonts/inter`, `fast-check`, `jest`, `@testing-library/react-native`
    - _Requirements: 14.4, 14.5, 17.3_

  - [x] 3.2 Create `App.js` entry point with provider wrappers
    - Load Inter fonts via `@expo-google-fonts/inter`
    - Wrap app in `AuthProvider` and `NavigationContainer`
    - Show splash/loading screen while fonts load
    - _Requirements: 14.4_

- [x] 4. Core modules
  - [x] 4.1 Create theme module at `src/theme/index.js`
    - Define `colors` (primary #1F6B4E, background #FAFAF7, accent #8A6E4B, text, error, success, border, cardBackground, locked)
    - Define `fonts`, `spacing`, and `borderRadius` constants per design
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 4.2 Create validation utilities at `src/utils/validation.js`
    - `validateName(name)` — error if empty/whitespace
    - `validateEmail(email)` — error if not valid email format
    - `validatePhone(phone)` — error if not exactly 10 digits
    - `validatePincode(pincode)` — error if not exactly 6 digits
    - `validatePassword(password)` — error if fewer than 8 characters
    - `validateRegistrationForm(fields)` — returns object with all field errors
    - _Requirements: 2.1_

  - [ ]* 4.3 Write property test for registration form validation (Property 2)
    - **Property 2: Registration Form Validation**
    - Generate random combinations of valid/invalid names, emails, phones, pincodes, passwords
    - Verify validation function returns correct error set for each combination
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.1**

  - [x] 4.4 Create API client at `src/api/client.js`
    - Axios instance with `baseURL: 'https://api.choosepure.in'` and 15s timeout
    - Request interceptor: read token from AsyncStorage, set `Authorization: Bearer <token>` header
    - Response interceptor: on 401, clear token from AsyncStorage and trigger auth reset
    - _Requirements: 1.3, 1.4_

  - [ ]* 4.5 Write property test for Bearer token header construction (Property 1)
    - **Property 1: Bearer Token Header Construction**
    - Generate random non-empty JWT token strings
    - Verify API client interceptor produces `Authorization` header with value `"Bearer " + token`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 1.3**

  - [x] 4.6 Create AuthContext at `src/context/AuthContext.js`
    - Provide `user`, `isLoading`, `isAuthenticated` state
    - Implement `login(email, password)` — POST `/api/user/login`, store token, set user
    - Implement `register(name, email, phone, pincode, password, referralCode?)` — POST `/api/user/register`, store token, set user
    - Implement `logout()` — POST `/api/user/logout`, clear token, reset user
    - Implement `checkAuth()` — GET `/api/user/me`, validate stored token on app launch
    - On 401 or failed checkAuth, clear token and set unauthenticated
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7_

- [x] 5. Checkpoint — Verify core modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Navigation setup
  - [x] 6.1 Create AuthStack at `src/navigation/AuthStack.js`
    - Stack navigator with screens: Onboarding, Login, Register, ForgotPassword, ResetPassword
    - _Requirements: 13.2, 13.3_

  - [x] 6.2 Create MainTabs at `src/navigation/MainTabs.js`
    - Bottom tab navigator with tabs: Dashboard, Polling, Suggestions, Referral, Profile
    - Use theme primary color for active tab indicator
    - Stack navigators nested inside Dashboard tab (for ReportDetail, Subscription) and Profile tab (for Vision, Subscription)
    - _Requirements: 13.1, 13.4_

  - [x] 6.3 Create RootNavigator at `src/navigation/RootNavigator.js`
    - Switch between AuthStack (unauthenticated) and MainTabs (authenticated) based on AuthContext
    - _Requirements: 13.3, 13.4_

- [x] 7. Auth screens
  - [x] 7.1 Implement OnboardingScreen at `src/screens/OnboardingScreen.js`
    - Display informational slides about ChoosePure mission and features
    - Show ChoosePure logo
    - On complete/skip: persist `onboarding_done` flag in AsyncStorage, navigate to Login
    - Skip onboarding if flag already set
    - _Requirements: 4.1, 4.2, 4.3, 14.5_

  - [x] 7.2 Implement LoginScreen at `src/screens/LoginScreen.js`
    - Email and password form fields
    - Call `AuthContext.login()` on submit
    - Display backend error messages on failure
    - Links to Register and ForgotPassword screens
    - Show ChoosePure logo in header
    - _Requirements: 1.1, 14.5_

  - [x] 7.3 Implement RegisterScreen at `src/screens/RegisterScreen.js`
    - Fields: name, email, phone, pincode, password, optional referral code
    - Client-side validation using `validation.js` before submit
    - Call `AuthContext.register()` on submit
    - Display backend validation errors (duplicate email, duplicate phone, invalid referral code)
    - Accept pre-filled referral code from navigation params (deep link)
    - Navigate to Dashboard on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 7.4 Implement ForgotPasswordScreen at `src/screens/ForgotPasswordScreen.js`
    - Email input field
    - POST `/api/user/forgot-password` on submit
    - Display confirmation message on success
    - _Requirements: 3.1, 3.2_

  - [x] 7.5 Implement ResetPasswordScreen at `src/screens/ResetPasswordScreen.js`
    - New password input (minimum 8 characters)
    - Extract reset token from navigation params (deep link)
    - POST `/api/user/reset-password` with token and new password
    - Display error if token is invalid/expired, prompt to request new link
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 8. Checkpoint — Verify auth flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Main screens — Dashboard and Reports
  - [x] 9.1 Implement DashboardScreen at `src/screens/DashboardScreen.js`
    - Fetch reports from GET `/api/reports`
    - Display scrollable report cards with product name, brand, category, image, status badges
    - Show purity score on first card for all users
    - Show purity score on all cards for subscribers; show lock indicator for non-subscribers
    - Display subscription status section
    - Pull-to-refresh with `RefreshControl`
    - Loading skeleton/spinner while fetching
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 16.4_

  - [ ]* 9.2 Write property test for report purity score visibility (Property 5)
    - **Property 5: Report Purity Score Visibility**
    - Generate random report lists (1-20 reports) and random subscription statuses
    - Verify purityScore is visible on index 0 always, on all indices for subscribers, hidden for non-subscribers at index > 0
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 9.3 Implement ReportDetailScreen at `src/screens/ReportDetailScreen.js`
    - Fetch full report from GET `/api/reports/:id`
    - Display test parameters, purity score, expert commentary, methodology, batch code, shelf life, test date
    - Download PDF button: fetch from GET `/api/reports/:id/pdf`, open share sheet via `expo-sharing`
    - Show subscription prompt for non-subscribers tapping locked reports
    - Error state with retry option
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Main screens — Polling
  - [x] 10.1 Implement PollingScreen at `src/screens/PollingScreen.js`
    - Fetch active products from GET `/api/polls/products`, display sorted by votes descending
    - Product selection and vote count input
    - Paid vote flow: POST `/api/polls/vote` → Razorpay checkout → POST `/api/polls/verify-payment`
    - Free vote flow for subscribers: check GET `/api/polls/free-vote-status`, POST `/api/polls/free-vote`
    - Handle Razorpay cancel/failure with error message and retry
    - Pull-to-refresh, loading indicators
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 16.4_

- [x] 11. Main screens — Suggestions
  - [x] 11.1 Implement SuggestionScreen at `src/screens/SuggestionScreen.js`
    - Fetch approved suggestions from GET `/api/suggestions`, display sorted by upvotes descending
    - Submit suggestion form: product name, category (required), reason (optional) → POST `/api/suggestions`
    - Upvote button → POST `/api/suggestions/:id/upvote`, optimistic update with rollback on failure
    - Display "already upvoted" message if user re-upvotes
    - Display validation errors from backend
    - Pull-to-refresh, loading indicators
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 16.4_

- [x] 12. Main screens — Subscription
  - [x] 12.1 Implement SubscriptionScreen at `src/screens/SubscriptionScreen.js`
    - Subscribe button for free users: POST `/api/subscription/create-order` → Razorpay checkout with `subscription_id`
    - On success: POST `/api/subscription/verify-payment` with razorpay_subscription_id, razorpay_payment_id, razorpay_signature
    - Update local user state to subscribed, navigate to Dashboard
    - Handle payment failure/cancel with error message and retry
    - Show current subscription status and expiry for already-subscribed users
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13. Main screens — Referral, Profile, Vision
  - [x] 13.1 Implement ReferralScreen at `src/screens/ReferralScreen.js`
    - Fetch stats from GET `/api/user/referral-stats`
    - Display referral code, referral link, total invited, completed, pending, free months earned
    - Share button: open native share sheet with referral link
    - Copy button: copy referral code to clipboard via `expo-clipboard`, show confirmation
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 13.2 Implement ProfileScreen at `src/screens/ProfileScreen.js`
    - Display user name, email, phone, subscription status, referral code, free months earned, subscription expiry from cached AuthContext user data
    - Sign-out button triggers `AuthContext.logout()`
    - Link to SubscriptionScreen for manage subscription
    - Link to VisionScreen
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 13.3 Implement VisionScreen at `src/screens/VisionScreen.js`
    - Static content: ChoosePure mission statement, team information, core values
    - Accessible from ProfileScreen and OnboardingScreen
    - _Requirements: 12.1, 12.2_

- [x] 14. Checkpoint — Verify all screens
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Deep linking and offline handling
  - [x] 15.1 Create deep link handler hook at `src/hooks/useDeepLink.js`
    - Listen for incoming URLs via `expo-linking`
    - Parse `choosepure.in/purity-wall?ref=CP-XXXXX` → navigate to Register with referral code
    - Parse `choosepure.in/user/reset-password?token=XXXXX` → navigate to ResetPassword with token
    - _Requirements: 17.1, 17.2_

  - [ ]* 15.2 Write property test for deep link referral code round-trip (Property 3)
    - **Property 3: Deep Link Referral Code Round-Trip**
    - Generate random referral codes matching `CP-XXXXX` pattern
    - Verify URL construction + parsing extracts original code unchanged
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 17.1, 2.3**

  - [ ]* 15.3 Write property test for deep link reset token round-trip (Property 4)
    - **Property 4: Deep Link Reset Token Round-Trip**
    - Generate random non-empty token strings
    - Verify reset URL construction + parsing extracts original token unchanged
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 17.2, 3.3**

  - [x] 15.4 Integrate `useDeepLink` hook into `App.js` / `RootNavigator`
    - Wire deep link handler to navigation actions
    - _Requirements: 13.5, 17.1, 17.2_

  - [x] 15.5 Implement offline banner and network monitoring
    - Use `@react-native-community/netinfo` to monitor connectivity
    - Display persistent offline banner when no network
    - Disable action buttons (vote, subscribe, submit) when offline
    - Show user-friendly error messages with retry for network failures
    - Show generic error message for 5xx server errors
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All mobile app code goes in the `mobile app/` folder; backend changes are in `server.js` at the project root
- Razorpay integration requires `expo-dev-client` for custom dev builds since `react-native-razorpay` has native modules
