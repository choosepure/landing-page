# Requirements: Google Sign-In

## Overview

Enable users to authenticate with the ChoosePure mobile app using their Google account via the "Continue with Google" button on the LoginScreen. The feature integrates `@react-native-google-signin/google-signin` with the existing Firebase Auth and backend JWT exchange flow.

## Requirements

### Requirement 1: Google Sign-In SDK Configuration

The app must configure the Google Sign-In SDK at startup with the correct web client ID so that sign-in attempts use the proper Firebase project credentials.

**Acceptance Criteria:**
- 1.1 Google Sign-In SDK is configured with the web client ID from `google-services.json` (type 3 OAuth client: `46652240387-5nq16fa0c2ujg0gtjbv396t1c0kifo5v.apps.googleusercontent.com`)
- 1.2 Configuration is called once during app initialization (before any sign-in attempt)
- 1.3 The `@react-native-google-signin/google-signin` Expo config plugin is added to `app.json` plugins array
- 1.4 Calling `configureGoogleSignIn()` multiple times does not cause errors

### Requirement 2: Google Account Selection

When the user taps "Continue with Google", the app must present the native Google account picker and obtain a Google ID token.

**Acceptance Criteria:**
- 2.1 Tapping "Continue with Google" triggers the native Google account picker UI
- 2.2 On Android, Google Play Services availability is checked before presenting the picker (with update dialog if needed)
- 2.3 On successful account selection, a Google ID token is obtained from the response
- 2.4 If the user cancels/dismisses the picker, no error message is shown and no state changes occur

### Requirement 3: Firebase Authentication with Google Credential

After obtaining the Google ID token, the app must create a Firebase credential and sign into Firebase Auth to get a Firebase ID token.

**Acceptance Criteria:**
- 3.1 A Firebase `GoogleAuthProvider` credential is created from the Google ID token
- 3.2 The app signs into Firebase Auth using `signInWithCredential()` with the Google credential
- 3.3 A Firebase ID token is retrieved from the authenticated user via `getIdToken()`
- 3.4 Firebase initialization is verified before attempting sign-in (using existing `ensureFirebase()` pattern)

### Requirement 4: Backend Token Exchange

The Firebase ID token obtained from Google Sign-In must be exchanged with the backend API using the existing endpoint and helper function.

**Acceptance Criteria:**
- 4.1 The Firebase ID token is sent to `POST /api/user/firebase-auth` via the existing `exchangeFirebaseToken()` function
- 4.2 On success, the backend JWT is stored in AsyncStorage under `'jwt_token'`
- 4.3 On success, the user object from the backend response is set in AuthContext state
- 4.4 The flow works for both new users (first-time Google sign-in creates account) and existing users (returns existing account)

### Requirement 5: AuthContext Integration

A `loginWithGoogle()` method must be added to AuthContext that orchestrates the full flow and follows the same patterns as existing auth methods.

**Acceptance Criteria:**
- 5.1 `loginWithGoogle()` is exposed via the AuthContext provider value
- 5.2 On success, analytics login event is logged with method `'google'`
- 5.3 On success, Crashlytics user ID is set
- 5.4 Analytics/Crashlytics failures do not prevent successful authentication
- 5.5 The method returns the backend response object `{ success, token, user }` or throws on error

### Requirement 6: LoginScreen UI Integration

The existing "Continue with Google" button on LoginScreen must be wired to the `loginWithGoogle()` method with proper loading and error states.

**Acceptance Criteria:**
- 6.1 The "Continue with Google" button calls `loginWithGoogle()` from AuthContext on press
- 6.2 A loading indicator is shown on the button while Google sign-in is in progress
- 6.3 The button is disabled during the sign-in process to prevent double-taps
- 6.4 Error messages from the sign-in flow are displayed in the existing error area
- 6.5 User cancellation (dismissing the Google picker) does not show an error message

### Requirement 7: Error Handling

The feature must handle all failure scenarios gracefully with user-friendly messages.

**Acceptance Criteria:**
- 7.1 Missing Google Play Services (Android) shows an appropriate message or update dialog
- 7.2 Network failures display "Check your connection and try again"
- 7.3 Firebase auth errors are mapped to user-friendly messages via the existing `mapFirebaseAuthError()` function
- 7.4 Backend API errors display the error message from the response
- 7.5 Unexpected errors display a generic "Something went wrong" message

### Requirement 8: Native Build Configuration

The app's native configuration must be updated to support the Google Sign-In native module.

**Acceptance Criteria:**
- 8.1 `@react-native-google-signin/google-signin` package is added to `package.json` dependencies
- 8.2 The Expo config plugin `@react-native-google-signin/google-signin` is added to `app.json` plugins array
- 8.3 iOS URL scheme for reversed client ID is configured (handled automatically by the Expo plugin)
- 8.4 The feature works in expo-dev-client custom builds (not Expo Go)

## Dependencies

- Existing: `@react-native-firebase/auth` v24, `@react-native-firebase/app` v24, `expo-dev-client`
- New: `@react-native-google-signin/google-signin` ^13.0.0
- Backend: `POST /api/user/firebase-auth` endpoint (already exists, no changes needed)

## Out of Scope

- Apple Sign-In (separate feature)
- Backend modifications (endpoint already handles any Firebase auth provider)
- Google Sign-In on web platform
- Account linking (merging Google account with existing email/phone account)
- Custom Google Sign-In UI (uses native platform picker)
