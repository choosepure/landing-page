# Implementation Plan: Comprehensive Analytics Integration

## Overview

This plan implements a unified analytics layer for the ChoosePure mobile app that dispatches events to Firebase Analytics, Mixpanel, and Meta (server-side Conversions API). The implementation follows an adapter pattern with a central service that fans out to provider-specific modules, plus a backend endpoint for Meta event forwarding.

## Tasks

- [x] 1. Install dependencies and create analytics config
  - [x] 1.1 Install mixpanel-react-native package and create analytics configuration file
    - Run `npm install mixpanel-react-native` in the mobile app directory
    - Create `src/config/analytics.js` with exported constants: `MIXPANEL_TOKEN`, `META_PIXEL_ID`, `META_BATCH_SIZE` (default 10), `META_FLUSH_INTERVAL` (default 30000ms), and `DEBUG` flag tied to `__DEV__`
    - Tokens should be read from environment/config (placeholder values for now)
    - _Requirements: 1.1, 9.1, 8.1_

- [x] 2. Implement Unified Analytics Service and adapters
  - [x] 2.1 Create the Unified Analytics Service (`src/services/analytics/index.js`)
    - Implement `initAnalytics(config)` that initializes all adapters via `Promise.allSettled`, filtering to only successfully-initialized adapters in the registry
    - Implement `trackEvent(eventName, properties)` with event name validation (`/^[a-z][a-z0-9_]{0,39}$/`), property enrichment (timestamp, platform, app_version), and parallel dispatch via `Promise.allSettled`
    - Implement `trackScreen(screenName, properties)` dispatching to all adapters
    - Implement `identify(userId, traits)` dispatching to all adapters
    - Implement `reset()` dispatching to all adapters
    - Add `__DEV__` guard for all debug logging (event names, properties, adapter failures)
    - Ensure pre-initialization calls are no-ops (check if adapters array is populated)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.3, 5.1, 6.1, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3_

  - [ ]* 2.2 Write property tests for Unified Analytics Service fan-out and enrichment
    - **Property 1: Fan-out completeness** — For any event name and properties, trackEvent calls all adapter trackEvent methods exactly once
    - **Property 2: Event enrichment** — For any input properties, adapters receive a superset containing timestamp (number), platform (string), app_version (string)
    - **Property 3: Fault isolation** — For any set of adapters where some throw, remaining adapters still receive the event and no exception propagates
    - **Property 5: Event name validation** — For any string, trackEvent dispatches if and only if name matches `/^[a-z][a-z0-9_]{0,39}$/`
    - **Property 11: Pre-initialization safety** — Calls before initAnalytics produce no errors and no adapter invocations
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 11.1, 11.2**

  - [x] 2.3 Create Firebase Adapter (`src/services/analytics/firebase.js`)
    - Implement adapter object with `name: 'firebase'`
    - `init()` resolves immediately (Firebase auto-initialized via native config)
    - `trackEvent(eventName, properties)` calls `analytics().logEvent(eventName, properties)`
    - `trackScreen(screenName, properties)` calls `analytics().logScreenView({ screen_name, screen_class })`
    - `identify(userId, traits)` calls `analytics().setUserId(userId)` and `analytics().setUserProperties(traits)`
    - `reset()` sets userId to null and calls `analytics().resetAnalyticsData()`
    - All methods check `isFirebaseInitialized()` and no-op if false
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 5.2, 6.2_

  - [x] 2.4 Create Mixpanel Adapter (`src/services/analytics/mixpanel.js`)
    - Implement adapter object with `name: 'mixpanel'`
    - `init(config)` creates Mixpanel instance with `config.mixpanelToken` and calls `mixpanel.init()`
    - `trackEvent(eventName, properties)` calls `mixpanel.track(eventName, properties)`
    - `trackScreen(screenName, properties)` calls `mixpanel.track('screen_view', { screen_name, ...properties })`
    - `identify(userId, traits)` calls `mixpanel.identify(userId)` and `mixpanel.getPeople().set(traits)`
    - `reset()` calls `mixpanel.reset()`
    - Wrap all SDK calls in try/catch to reject gracefully without crashing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 5.3, 6.3_

  - [x] 2.5 Create Meta Adapter with batching (`src/services/analytics/meta.js`)
    - Implement adapter object with `name: 'meta'`
    - `init(config)` stores pixelId and starts flush interval timer (`config.metaFlushInterval`)
    - `trackEvent(eventName, properties)` adds event to queue with eventName, properties, timestamp, userId, userData; triggers flush if queue >= `metaBatchSize`
    - `trackScreen(screenName, properties)` adds PageView-equivalent event to queue
    - `identify(userId, traits)` stores userId and traits for inclusion in subsequent events
    - `reset()` clears stored user data and triggers flush of remaining queue
    - `flush()` POSTs batch payload to `/api/analytics/events` with pixelId, events, platform, appVersion; re-queues on failure (max 1 retry), discards on second failure
    - Enforce queue length never exceeds `2 * metaBatchSize`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 5.4, 6.4_

  - [ ]* 2.6 Write property tests for Meta Adapter batching logic
    - **Property 7: Meta queue size invariant** — For any sequence of trackEvent calls and flush outcomes, queue length never exceeds `2 * metaBatchSize`
    - **Property 8: Meta batch trigger** — Flush is triggered immediately when queue reaches metaBatchSize
    - **Property 9: Meta retry-then-drop** — Failed batches are re-queued once; second failure discards them
    - **Property 10: Identity persistence** — After identify(), all queued events include userId and userData until reset()
    - **Validates: Requirements 9.2, 9.3, 9.6, 9.7, 9.8, 5.4, 6.4**

- [x] 3. Checkpoint - Verify adapters and service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement backend analytics endpoint
  - [x] 4.1 Create POST `/api/analytics/events` endpoint in `server.js`
    - Add route handler behind `authenticateUser` middleware
    - Validate request body: require `pixelId` (string) and `events` (non-empty array); return 400 with descriptive error if missing
    - For each event in the batch, forward to Meta Conversions API with proper parameter mapping (event_name → event_name, action_source → 'app', event_time, custom_data, user_data)
    - Hash PII fields (email, phone) with SHA-256 before forwarding to Meta
    - On Meta API error, log the error and return 502 status to client
    - On success, return 200 with `{ success: true, processed: events.length }`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 4.2 Write unit tests for backend analytics endpoint
    - Test 400 response when pixelId is missing
    - Test 400 response when events array is missing or empty
    - Test successful forwarding with mocked Meta API
    - Test 502 response when Meta API returns error
    - **Property 13: Backend payload validation** — For any request missing pixelId or events, endpoint returns 400
    - **Validates: Requirements 10.1, 10.3, 10.4**

- [x] 5. Initialize analytics in App.js and add screen tracking
  - [x] 5.1 Integrate analytics initialization and screen tracking into `App.js`
    - Import `initAnalytics` and `trackScreen` from `./src/services/analytics`
    - Import config from `./src/config/analytics`
    - Add `initAnalytics(config)` call in the existing `useEffect` on mount (inside `setupFCM` or a parallel effect)
    - Replace the existing `logScreenView` call in `onNavigationStateChange` with `trackScreen(currentRouteName, { previous_screen: previousRouteName })`
    - Remove the direct import of `logScreenView` from `src/services/firebase/analytics`
    - Add AppState listener that calls `metaAdapter.flush()` (via an exported `flushMetaQueue` function) when app transitions to 'background'
    - _Requirements: 1.1, 4.1, 4.2, 14.1, 14.2_

  - [ ]* 5.2 Write property test for screen tracking de-duplication
    - **Property 6: Screen tracking de-duplication** — For any sequence of navigation changes, consecutive same-route changes do not produce duplicate screen_view events
    - **Validates: Requirements 4.1, 4.2**

- [x] 6. Checkpoint - Verify initialization and screen tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Replace existing Firebase analytics calls with unified service
  - [x] 7.1 Replace analytics calls in auth-related screens and context
    - Update `LoginScreen.js`: replace Firebase `logLogin` with `trackEvent('login', { method })`
    - Update `RegisterScreen.js` / `OTPScreen.js`: replace Firebase `logSignUp` with `trackEvent('sign_up', { method })`
    - Update `AuthContext` or logout handler: add `trackEvent('logout')` and call `reset()` on sign out
    - Add `identify(user.uid, { email, name })` calls after successful login/signup
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 12.1_

  - [x] 7.2 Replace analytics calls in scanning and product screens
    - Update `ScannerScreen.js`: replace `logScanProduct` with `trackEvent('product_scanned', { barcode })` and add `trackEvent('manual_barcode_entered', { barcode })`
    - _Requirements: 12.1, 12.2_

- [x] 8. Add new event tracking across all remaining screens
  - [x] 8.1 Add onboarding event tracking
    - Update `OnboardingScreen.js`: add `trackEvent('onboarding_started')` on mount, `trackEvent('onboarding_completed', { slide_count })` on finish, `trackEvent('onboarding_skipped', { slide_index })` on skip
    - _Requirements: 12.1, 12.2_

  - [x] 8.2 Add report and subscription event tracking
    - Update `ReportDetailScreen.js`: add `trackEvent('report_viewed', { report_id, product_name })` on mount, `trackEvent('report_pdf_downloaded', { report_id, product_name })` on PDF download
    - Update `SubscriptionScreen.js`: add `trackEvent('subscribe_tapped', { screen, plan })`, `trackEvent('subscription_started', { plan, amount })`, `trackEvent('subscription_cancelled', { plan })`
    - Update `DashboardScreen.js`: add `trackEvent('subscribe_tapped', { screen: 'Dashboard', plan })` on subscribe CTA
    - _Requirements: 12.1, 12.2_

  - [x] 8.3 Add voting, referral, CTA, and profile event tracking
    - Update `PollingScreen.js`: replace `logVoteCast` with `trackEvent('vote_cast', { product_id, vote_count })`, add `trackEvent('vote_payment_completed', { product_id, amount })`
    - Update `ReferralScreen.js`: add `trackEvent('referral_shared', { method })`, `trackEvent('referral_code_copied')`
    - Add generic `trackEvent('cta_tapped', { cta_name, screen })` calls on key CTA buttons across `DashboardScreen`, `SubscriptionScreen`, and other screens
    - Update `EditProfileScreen.js`: add `trackEvent('profile_edited', { fields_changed })`
    - Update `ProfileScreen.js`: add `trackEvent('rate_app_tapped')` on rate button press
    - _Requirements: 12.1, 12.2_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check (already in devDependencies)
- Unit tests validate specific examples and edge cases
- The existing `src/services/firebase/analytics.js` file remains untouched (other screens may still import from it during gradual migration)
- The Meta adapter uses the existing `apiClient` (axios) for HTTP calls to the backend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.2"] },
    { "id": 3, "tasks": ["2.6", "5.1"] },
    { "id": 4, "tasks": ["5.2", "7.1", "7.2"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3"] }
  ]
}
```
