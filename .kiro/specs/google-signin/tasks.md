# Tasks: Google Sign-In

## Task 1: Install and configure @react-native-google-signin/google-signin

- [x] 1.1 Add `@react-native-google-signin/google-signin` (^13.0.0) to `package.json` dependencies
- [x] 1.2 Add `"@react-native-google-signin/google-signin"` to the `plugins` array in `mobile app/app.json`
- [x] 1.3 Run `npm install` to install the new dependency

## Task 2: Create GoogleSignInService module

- [x] 2.1 Create `mobile app/src/services/firebase/googleSignIn.js` with `configureGoogleSignIn()` function that calls `GoogleSignin.configure()` with webClientId `46652240387-5nq16fa0c2ujg0gtjbv396t1c0kifo5v.apps.googleusercontent.com`
- [x] 2.2 Implement `signInWithGoogle()` async function that: checks Play Services, calls `GoogleSignin.signIn()`, handles cancellation, creates Firebase credential from Google ID token, signs into Firebase with credential, and returns `{ user, idToken }` (Firebase ID token)
- [x] 2.3 Add error handling: throw with `code: 'SIGN_IN_CANCELLED'` on cancellation, `code: 'NO_ID_TOKEN'` when token is missing, and propagate Firebase errors

## Task 3: Add loginWithGoogle() to AuthContext

- [x] 3.1 Import `signInWithGoogle` from the new GoogleSignInService module in `AuthContext.js`
- [x] 3.2 Implement `loginWithGoogle()` async function that calls `signInWithGoogle()`, exchanges the Firebase ID token via `exchangeFirebaseToken()`, sets user state, logs analytics (`logLogin('google')`), and sets Crashlytics user ID
- [x] 3.3 Wrap analytics/Crashlytics calls in try-catch so they never block authentication
- [x] 3.4 Expose `loginWithGoogle` in the AuthContext.Provider value object

## Task 4: Wire LoginScreen "Continue with Google" button

- [x] 4.1 Add `loginWithGoogle` to the destructured `useAuth()` call in LoginScreen
- [x] 4.2 Add `googleLoading` state variable for the Google button loading state
- [x] 4.3 Implement `handleGoogleSignIn()` handler that calls `loginWithGoogle()`, handles `SIGN_IN_CANCELLED` silently, and displays other errors in the existing error state
- [x] 4.4 Update the "Continue with Google" `<Button>` to call `handleGoogleSignIn` on press, show `ActivityIndicator` when loading, and be disabled during sign-in

## Task 5: Initialize Google Sign-In at app startup

- [x] 5.1 Import `configureGoogleSignIn` from GoogleSignInService in `App.js`
- [x] 5.2 Call `configureGoogleSignIn()` during app initialization (outside of component render, or in a useEffect with empty deps)

## Task 6: Write unit tests for GoogleSignInService

- [ ] 6.1 Create test file `mobile app/src/services/firebase/__tests__/googleSignIn.test.js`
- [ ] 6.2 Test `configureGoogleSignIn()` calls `GoogleSignin.configure` with correct webClientId
- [ ] 6.3 Test `signInWithGoogle()` success path: mock Google SDK and Firebase, verify returns `{ user, idToken }`
- [ ] 6.4 Test `signInWithGoogle()` cancellation: mock cancelled response, verify throws with code `'SIGN_IN_CANCELLED'`
- [ ] 6.5 Test `signInWithGoogle()` missing token: mock response without idToken, verify throws with code `'NO_ID_TOKEN'`
- [ ] 6.6 Test `signInWithGoogle()` Firebase not initialized: verify throws appropriate error
