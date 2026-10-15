/**
 * Firebase Auth Service
 *
 * Wraps Firebase Authentication operations for email/password sign-in and
 * sign-up. Returns Firebase ID tokens that the AuthContext exchanges with
 * the backend API for JWT tokens.
 *
 * Does NOT handle backend JWT exchange — that responsibility stays in
 * AuthContext.
 */

import auth from '@react-native-firebase/auth';
import { isFirebaseInitialized } from './index';

// ---------------------------------------------------------------------------
// Error-code → user-friendly message mapping
// ---------------------------------------------------------------------------

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
  'auth/session-expired': 'Verification code expired. Please request a new one.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure Firebase is available before performing an auth operation.
 * Throws a descriptive error when Firebase has not been initialised.
 */
function ensureFirebase() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Auth operations are unavailable.');
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new Firebase user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('@react-native-firebase/auth').FirebaseAuthTypes.User, idToken: string }>}
 */
export async function signUpWithEmail(email, password) {
  ensureFirebase();

  const credential = await auth().createUserWithEmailAndPassword(email, password);
  const idToken = await credential.user.getIdToken();

  return { user: credential.user, idToken };
}

/**
 * Sign in an existing Firebase user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('@react-native-firebase/auth').FirebaseAuthTypes.User, idToken: string }>}
 */
export async function signInWithEmail(email, password) {
  ensureFirebase();

  const credential = await auth().signInWithEmailAndPassword(email, password);
  const idToken = await credential.user.getIdToken();

  return { user: credential.user, idToken };
}

/**
 * Retrieve a fresh ID token for the currently signed-in user.
 *
 * @param {boolean} [forceRefresh=false] When `true`, forces a token refresh
 *   even if the cached token has not expired.
 * @returns {Promise<string>} The Firebase ID token.
 */
export async function getIdToken(forceRefresh = false) {
  ensureFirebase();

  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user. Cannot retrieve ID token.');
  }

  return currentUser.getIdToken(forceRefresh);
}

/**
 * Sign out the current Firebase user.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  ensureFirebase();
  await auth().signOut();
}

/**
 * Subscribe to Firebase auth state changes.
 *
 * @param {(user: import('@react-native-firebase/auth').FirebaseAuthTypes.User | null) => void} callback
 *   Called with the current user (or `null` on sign-out).
 * @returns {() => void} Unsubscribe function.
 */
export function onAuthStateChanged(callback) {
  ensureFirebase();
  return auth().onAuthStateChanged(callback);
}

/**
 * Map a Firebase Auth error to a user-friendly message.
 *
 * @param {Error & { code?: string }} error  A Firebase Auth error object.
 * @returns {string} A human-readable error message suitable for display.
 */
export function mapFirebaseAuthError(error) {
  if (!error || !error.code) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return AUTH_ERROR_MESSAGES[error.code] || DEFAULT_ERROR_MESSAGE;
}

// ---------------------------------------------------------------------------
// Phone Number Authentication
// ---------------------------------------------------------------------------

/**
 * Normalize a phone number to E.164 format for Indian numbers.
 *
 * Rules:
 * - Already starts with `+91` → returned as-is
 * - Starts with `91` (no `+`) → `+` is prepended
 * - 10-digit number → `+91` is prepended
 *
 * @param {string} phoneNumber  Raw phone number input.
 * @returns {string} Phone number in E.164 format (`+91XXXXXXXXXX`).
 */
export function formatPhoneToE164(phoneNumber) {
  const digits = phoneNumber.replace(/[\s\-()]/g, '');

  if (digits.startsWith('+91')) {
    return digits;
  }

  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Return as-is for numbers that don't match expected patterns
  return digits;
}

/**
 * Initiate phone number sign-in by sending an SMS verification code.
 *
 * The phone number is normalised to E.164 format (`+91` prefix for Indian
 * numbers) before being sent to Firebase.
 *
 * @param {string} phoneNumber  The user's phone number (10-digit, or with
 *   country code).
 * @returns {Promise<import('@react-native-firebase/auth').FirebaseAuthTypes.ConfirmationResult>}
 *   A confirmation object used to verify the OTP via {@link confirmOTP}.
 */
export async function signInWithPhone(phoneNumber) {
  ensureFirebase();

  const formattedNumber = formatPhoneToE164(phoneNumber);
  const confirmation = await auth().signInWithPhoneNumber(formattedNumber);

  return confirmation;
}

/**
 * Complete phone number authentication by verifying the OTP code.
 *
 * @param {import('@react-native-firebase/auth').FirebaseAuthTypes.ConfirmationResult} confirmation
 *   The confirmation object returned by {@link signInWithPhone}.
 * @param {string} code  The 6-digit OTP code received via SMS.
 * @returns {Promise<{ user: import('@react-native-firebase/auth').FirebaseAuthTypes.User, idToken: string }>}
 */
export async function confirmOTP(confirmation, code) {
  ensureFirebase();

  const credential = await confirmation.confirm(code);
  const user = credential.user;
  const idToken = await user.getIdToken();

  return { user, idToken };
}
