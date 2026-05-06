/**
 * Google Sign-In Service
 *
 * Handles Google Sign-In flow using @react-native-google-signin/google-signin.
 * Obtains a Google ID token, creates a Firebase credential, signs into
 * Firebase Auth, and returns the Firebase ID token for backend exchange.
 *
 * Uses the same pattern as auth.js — Firebase operations are guarded by
 * isFirebaseInitialized() and errors are thrown with descriptive codes.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { isFirebaseInitialized } from './index';

// Web client ID from google-services.json (client_type: 3)
const WEB_CLIENT_ID = '46652240387-5nq16fa0c2ujg0gtjbv396t1c0kifo5v.apps.googleusercontent.com';

/**
 * Configure Google Sign-In SDK with the web client ID.
 * Must be called once at app startup before any sign-in attempt.
 * Safe to call multiple times (idempotent).
 */
export function configureGoogleSignIn() {
  try {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
    });
  } catch (error) {
    console.warn('[GoogleSignIn] Failed to configure:', error.message);
  }
}

/**
 * Perform the full Google Sign-In flow:
 * 1. Check Google Play Services availability (Android)
 * 2. Present native Google account picker
 * 3. Create Firebase credential from Google ID token
 * 4. Sign into Firebase Auth with credential
 * 5. Return Firebase user and ID token
 *
 * @returns {Promise<{ user: object, idToken: string }>}
 * @throws {{ code: string, message: string }} on cancellation or failure
 */
export async function signInWithGoogle() {
  if (!isFirebaseInitialized()) {
    throw { code: 'FIREBASE_NOT_INITIALIZED', message: 'Firebase is not initialized. Google Sign-In is unavailable.' };
  }

  // Step 1: Check Play Services (Android only, no-op on iOS)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Step 2: Present Google account picker
  const response = await GoogleSignin.signIn();

  // Handle user cancellation
  if (response.type === 'cancelled') {
    throw { code: 'SIGN_IN_CANCELLED', message: 'User cancelled Google Sign-In' };
  }

  // Step 3: Extract Google ID token
  const googleIdToken = response.data?.idToken;
  if (!googleIdToken) {
    throw { code: 'NO_ID_TOKEN', message: 'Failed to obtain Google ID token. Check webClientId configuration.' };
  }

  // Step 4: Create Firebase credential and sign in
  const googleCredential = auth.GoogleAuthProvider.credential(googleIdToken);
  const userCredential = await auth().signInWithCredential(googleCredential);

  // Step 5: Get Firebase ID token for backend exchange
  const firebaseIdToken = await userCredential.user.getIdToken();

  return { user: userCredential.user, idToken: firebaseIdToken };
}
