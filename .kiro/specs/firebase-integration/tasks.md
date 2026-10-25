# Implementation Plan: Firebase Integration

## Overview

This plan implements Firebase services integration into the ChoosePure React Native (Expo SDK 52) app. The implementation proceeds incrementally: SDK setup first, then authentication (email + phone), followed by push notifications, feature flags, analytics, crash reporting, and finally real-time vote counts. Each step builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Install Firebase dependencies and configure Expo plugins
  - [x] 1.1 Install all `@react-native-firebase/*` packages and `expo-dev-client`
    - Install `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/messaging`, `@react-native-firebase/remote-config`, `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics`, `@react-native-firebase/firestore`, and `expo-dev-client`
    - _Requirements: 1.1_

  - [x] 1.2 Update `app.json` with Firebase config plugins
    - Add `@react-native-firebase/app` and `@react-native-firebase/crashlytics` to the plugins array
    - Update `expo-build-properties` to include `ios.useFrameworks: "static"`
    - Add placeholder entries for `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in project root
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Create Firebase initialization module at `src/services/firebase/index.js`
    - Implement `isFirebaseInitialized()` and `getFirebaseApp()` functions
    - Add graceful degradation: if Firebase is unavailable, log warning and allow app to continue
    - _Requirements: 1.3, 1.4_

  - [ ]* 1.4 Write unit tests for Firebase initialization module
    - Test `isFirebaseInitialized()` returns true when Firebase app exists
    - Test `isFirebaseInitialized()` returns false when Firebase is not configured
    - Test `getFirebaseApp()` returns null gracefully on failure
    - _Requirements: 1.3, 1.4_

- [x] 2. Implement Firebase Authentication (Email/Password)
  - [x] 2.1 Create Auth Service at `src/services/firebase/auth.js`
    - Implement `signUpWithEmail(email, password)` — creates Firebase user, returns `{ user, idToken }`
    - Implement `signInWithEmail(email, password)` — authenticates user, returns `{ user, idToken }`
    - Implement `getIdToken()` — returns current user's fresh ID token
    - Implement `signOut()` — signs out from Firebase Auth
    - Implement `onAuthStateChanged(callback)` — subscribes to auth state changes
    - Implement `mapFirebaseAuthError(error)` — maps Firebase error codes to user-friendly messages
    - _Requirements: 2.1, 2.3, 2.5, 2.6_

  - [ ]* 2.2 Write property test for Firebase auth error code mapping
    - **Property 2: Firebase auth error codes map to user-friendly messages**
    - **Validates: Requirements 2.5, 2.6**
    - Use fast-check to generate all known Firebase auth error codes and verify each maps to a non-empty, user-readable string without internal codes

  - [x] 2.3 Modify `src/context/AuthContext.js` to use Firebase Auth for email login and registration
    - Replace direct backend `POST /api/user/login` with `signInWithEmail()` → exchange Firebase ID token via `POST /api/user/firebase-auth`
    - Replace direct backend `POST /api/user/register` with `signUpWithEmail()` → exchange Firebase ID token via `POST /api/user/firebase-auth`
    - Add `exchangeFirebaseToken(idToken)` helper that calls backend and stores returned JWT
    - Update `logout()` to call Firebase `signOut()` in addition to backend logout and AsyncStorage clear
    - _Requirements: 2.2, 2.4, 2.7_

  - [ ]* 2.4 Write property test for Firebase auth triggering backend token exchange
    - **Property 1: Successful Firebase auth triggers backend token exchange**
    - **Validates: Requirements 2.2, 2.4, 3.4**
    - Use fast-check to generate various auth scenarios (email sign-in, registration) and verify backend exchange is always called with the Firebase ID token

  - [x] 2.5 Update `LoginScreen.js` to display Firebase-specific error messages
    - Use `mapFirebaseAuthError` to show user-friendly messages for login failures
    - _Requirements: 2.5_

  - [x] 2.6 Update `RegisterScreen.js` to display Firebase-specific error messages
    - Use `mapFirebaseAuthError` to show user-friendly messages for registration failures
    - _Requirements: 2.6_

- [x] 3. Implement Phone Number Authentication
  - [x] 3.1 Add phone auth functions to `src/services/firebase/auth.js`
    - Implement `signInWithPhone(phoneNumber)` — formats to E.164 (`+91` prefix), calls `verifyPhoneNumber`, returns confirmation object
    - Implement `confirmOTP(confirmation, code)` — verifies OTP, returns `{ user, idToken }`
    - _Requirements: 3.1, 3.3_

  - [ ]* 3.2 Write property test for phone number E.164 formatting
    - **Property 12: Valid phone numbers trigger OTP request in correct format**
    - **Validates: Requirements 3.1**
    - Use fast-check to generate valid 10-digit Indian phone numbers and verify they are formatted as `+91XXXXXXXXXX` before being sent to Firebase

  - [x] 3.3 Create `src/screens/OTPScreen.js`
    - Build OTP input screen with 6-digit code entry
    - Implement 60-second countdown timer for code validity
    - Add resend OTP button (enabled after countdown expires)
    - Show loading indicator while sending/verifying OTP
    - Display error messages for invalid/expired codes
    - On successful verification, call `exchangeFirebaseToken` from AuthContext
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.4 Add OTPScreen to `src/navigation/AuthStack.js`
    - Register OTPScreen in the auth stack navigator
    - Add "Sign in with Phone" option to LoginScreen that navigates to phone input → OTP flow
    - Update AuthContext with `loginWithPhone()` and `confirmPhoneOTP()` methods
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 3.5 Write unit tests for OTPScreen
    - Test countdown timer decrements correctly
    - Test resend button enables after countdown expires
    - Test error display for invalid OTP
    - Test loading state during verification
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Push Notifications (FCM)
  - [x] 5.1 Create FCM Service at `src/services/firebase/messaging.js`
    - Implement `requestNotificationPermission()` — requests iOS/Android permission, returns status
    - Implement `getFCMToken()` — retrieves device token from FCM
    - Implement `onTokenRefresh(callback)` — subscribes to token refresh events
    - Implement `onForegroundMessage(callback)` — subscribes to foreground message events
    - Implement `onNotificationOpened(callback)` — handles background notification taps
    - Implement `getInitialNotification()` — checks for notification that launched the app
    - Implement `configureIOSForegroundPresentation()` — sets iOS alert/badge/sound options
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7_

  - [x] 5.2 Create notification handler utility at `src/utils/notificationHandler.js`
    - Implement `getNavigationAction(notificationData)` — maps payload `{ type, targetId }` to `{ screen, params }`
    - Handle types: `report` → ReportScreen, `poll` → PollingScreen, `subscription` → SubscriptionScreen, `general` → DashboardScreen
    - _Requirements: 4.4_

  - [ ]* 5.3 Write property test for notification payload navigation routing
    - **Property 10: Notification payload navigation routes to correct screen**
    - **Validates: Requirements 4.4**
    - Use fast-check to generate valid notification payloads with various types and targetIds, verify correct screen routing

  - [x] 5.4 Create `src/components/NotificationBanner.js`
    - Build animated banner component that slides in from top on foreground notifications
    - Auto-dismiss after 4 seconds
    - Tappable to navigate to target screen using `getNavigationAction`
    - _Requirements: 4.3_

  - [x] 5.5 Integrate FCM into `App.js`
    - On app launch: request notification permission, get FCM token, send token to backend via `POST /api/user/fcm-token`
    - Set up foreground message handler to show NotificationBanner
    - Set up background notification open handler for deep linking
    - Check for initial notification (app launched from terminated state)
    - Handle token refresh by sending updated token to backend
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

  - [ ]* 5.6 Write unit tests for FCM service and notification handler
    - Test token retrieval and backend registration
    - Test token refresh triggers backend update
    - Test foreground message callback invocation
    - Test initial notification processing
    - _Requirements: 4.2, 4.5, 4.7_

- [x] 6. Implement Feature Flags and Remote Config
  - [x] 6.1 Create Remote Config Service at `src/services/firebase/remoteConfig.js`
    - Define `DEFAULTS` object with all feature flag default values
    - Implement `initRemoteConfig()` — sets defaults, fetches with 12-hour minimum interval, activates
    - Implement `getFeatureFlag(key)` — returns current value for a flag key
    - Implement `getAllFlags()` — returns all current flag values
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 6.2 Create `src/hooks/useFeatureFlag.js`
    - Implement `useFeatureFlag(key, defaultValue)` hook
    - Returns the current Remote Config value for the key, falling back to `defaultValue`
    - Never returns `undefined` or `null`
    - _Requirements: 5.3, 5.4_

  - [ ]* 6.3 Write property test for useFeatureFlag value resolution
    - **Property 3: useFeatureFlag returns correct values for any registered key**
    - **Validates: Requirements 5.2, 5.3, 5.4**
    - Use fast-check to generate various flag keys and default values, verify hook never returns undefined/null

  - [x] 6.4 Initialize Remote Config in `App.js`
    - Call `initRemoteConfig()` during app startup after Firebase initialization
    - _Requirements: 5.1_

- [x] 7. Implement Analytics Service
  - [x] 7.1 Create Analytics Service at `src/services/firebase/analytics.js`
    - Implement `logScreenView(screenName, screenClass)`
    - Implement `logSignUp(method)` — logs `sign_up` event with method ('email' | 'phone')
    - Implement `logLogin(method)` — logs `login` event with method
    - Implement `logVoteCast(productId, voteCount)` — logs `vote_cast` custom event
    - Implement `logPurchase(amount, currency)` — logs `purchase` event
    - Implement `logScanProduct(barcode)` — logs `scan_product` custom event
    - Implement `setUserId(userId)` — sets Firebase Analytics user ID
    - Implement `setUserProperties(properties)` — sets user properties
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 7.2 Write property test for custom analytics event parameters
    - **Property 5: Custom analytics events log with correct parameters**
    - **Validates: Requirements 6.4, 6.5, 6.6**
    - Use fast-check to generate product IDs, vote counts, amounts, currencies, and barcodes; verify events are logged with all parameters present and correctly typed

  - [x] 7.3 Integrate screen tracking with React Navigation in `App.js`
    - Add `onStateChange` handler to NavigationContainer that calls `logScreenView` on each navigation
    - _Requirements: 6.1_

  - [ ]* 7.4 Write property test for screen navigation analytics
    - **Property 4: Screen navigation triggers analytics screen view event**
    - **Validates: Requirements 6.1**
    - Use fast-check to generate screen names and verify `logScreenView` is called with correct parameters

  - [x] 7.5 Add analytics events to auth flows
    - Log `sign_up` event in AuthContext after successful registration (with method 'email' or 'phone')
    - Log `login` event in AuthContext after successful login (with method 'email' or 'phone')
    - Set Firebase Analytics user ID after authentication
    - _Requirements: 6.2, 6.3, 6.7_

  - [ ]* 7.6 Write property test for analytics user ID matching backend user ID
    - **Property 6: Analytics user ID matches backend user ID**
    - **Validates: Requirements 6.7**
    - Use fast-check to generate user IDs and verify the Firebase Analytics user ID is set to match the backend user ID

  - [x] 7.7 Add analytics events to PollingScreen and barcode scanning
    - Log `vote_cast` event after successful vote in PollingScreen
    - Log `purchase` event after successful Razorpay payment
    - Log `scan_product` event after barcode scan
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Crash Reporting (Crashlytics)
  - [x] 9.1 Create Crashlytics Service at `src/services/firebase/crashlytics.js`
    - Implement `setCrashlyticsUserId(userId)` — sets user ID for crash reports
    - Implement `logMessage(message)` — adds breadcrumb log message
    - Implement `recordError(error, context)` — records non-fatal error with context
    - Implement `recordAPIError(endpoint, statusCode, error)` — records API error with custom attributes
    - Implement `setEnabled(enabled)` — enables/disables Crashlytics collection
    - Disable auto-collection in `__DEV__` mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.2 Write property test for Crashlytics API error recording
    - **Property 7: Crashlytics records API errors with correct attributes**
    - **Validates: Requirements 7.4**
    - Use fast-check to generate endpoint paths and HTTP status codes, verify `recordAPIError` records with matching `endpoint` and `statusCode` attributes

  - [x] 9.3 Create `src/components/ErrorBoundary.js`
    - Build React class component error boundary
    - On error catch: record to Crashlytics as non-fatal exception with component stack trace
    - Render fallback UI with retry option
    - _Requirements: 7.6_

  - [ ]* 9.4 Write property test for ErrorBoundary Crashlytics recording
    - **Property 8: Error boundary errors recorded as non-fatal Crashlytics exceptions**
    - **Validates: Requirements 7.6**
    - Use fast-check to generate error messages and component stacks, verify Crashlytics records them as non-fatal exceptions with stack trace attribute

  - [x] 9.5 Integrate Crashlytics into the app
    - Wrap app root with ErrorBoundary in `App.js`
    - Set Crashlytics user ID in AuthContext after authentication
    - Extend axios response interceptor in `src/api/client.js` to call `recordAPIError` for 5xx errors
    - _Requirements: 7.1, 7.2, 7.4, 7.6_

  - [ ]* 9.6 Write property test for Crashlytics user ID association
    - **Property 11: Crashlytics user ID set for authenticated users**
    - **Validates: Requirements 7.2**
    - Use fast-check to generate user IDs and verify `setCrashlyticsUserId` is called with the backend user ID

- [x] 10. Implement Real-time Vote Counts (Firestore)
  - [x] 10.1 Create Firestore Service at `src/services/firebase/firestore.js`
    - Implement `subscribeToVoteCounts(productIds, onUpdate, onError)` — subscribes to `voteCounts` collection, returns unsubscribe function
    - Implement `subscribeToSingleProduct(productId, onUpdate, onError)` — subscribes to single document
    - Use product ID as document key in `voteCounts` collection
    - _Requirements: 8.1, 8.6_

  - [x] 10.2 Create `src/hooks/useRealtimeVotes.js`
    - Implement `useRealtimeVotes(productIds)` hook
    - Returns `{ voteCounts: Map<productId, count>, isConnected: boolean }`
    - Subscribe on mount, unsubscribe on unmount or when `productIds` change
    - Track connection state for offline indicator
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.3 Write property test for Firestore vote count updates in hook state
    - **Property 9: Firestore vote count updates reflected in component state**
    - **Validates: Requirements 8.2**
    - Use fast-check to generate vote count updates and product IDs, verify the hook's `voteCounts` map reflects the latest values

  - [x] 10.4 Integrate real-time votes into `PollingScreen.js`
    - Use `useRealtimeVotes` hook with current product IDs
    - Merge Firestore real-time counts with initial API-fetched data
    - Show "Live updates paused" indicator when `isConnected` is false
    - Unsubscribe automatically when screen loses focus
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 10.5 Write unit tests for useRealtimeVotes hook
    - Test subscription is created on mount with correct product IDs
    - Test unsubscription on unmount
    - Test vote count map updates when snapshot fires
    - Test `isConnected` becomes false on error
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Final wiring and integration
  - [x] 11.1 Create `firebase.json` configuration file
    - Configure `crashlytics_auto_collection_enabled: false` for development
    - Configure analytics collection settings
    - _Requirements: 7.5_

  - [x] 11.2 Update `App.js` with complete Firebase integration
    - Ensure initialization order: fonts → Remote Config → FCM permissions → notification handlers → ErrorBoundary wrapper
    - Wire up screen tracking via NavigationContainer `onStateChange`
    - Set up foreground notification display with NotificationBanner
    - _Requirements: 1.3, 4.1, 5.1, 6.1_

  - [x] 11.3 Update `src/api/client.js` with Crashlytics error recording
    - Extend response error interceptor to call `recordAPIError` for status >= 500
    - Import Crashlytics service conditionally (no-op if Firebase unavailable)
    - _Requirements: 7.4_

  - [x] 11.4 Update AuthContext with analytics and Crashlytics user ID
    - After successful login/registration: call `setUserId` for Analytics and `setCrashlyticsUserId` for Crashlytics
    - On logout: clear user IDs from Analytics and Crashlytics
    - _Requirements: 6.7, 7.2_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All Firebase modules must be mocked in tests using Jest module mocks
- The backend API changes (new `/api/user/firebase-auth`, `/api/user/fcm-token` endpoints) are assumed to be implemented separately — this plan covers mobile app code only
- Platform config files (`google-services.json`, `GoogleService-Info.plist`) must be obtained from Firebase Console and placed in the project root before building
