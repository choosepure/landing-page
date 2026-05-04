/**
 * Firebase Analytics Service
 *
 * Provides event-logging and user-identification helpers that wrap
 * `@react-native-firebase/analytics`.  Every public function is a
 * no-op when Firebase is not initialised, and failures are caught
 * and logged as warnings — analytics is non-critical and must never
 * crash the app.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import analytics from '@react-native-firebase/analytics';
import { isFirebaseInitialized } from './index';

/**
 * Log a screen view event.
 *
 * @param {string} screenName  — the name of the screen being viewed
 * @param {string} [screenClass] — optional screen class / component name
 * Requirement: 6.1
 */
export async function logScreenView(screenName, screenClass) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.warn('[Analytics] Failed to log screen view:', error.message);
  }
}

/**
 * Log a sign-up event.
 *
 * @param {'email' | 'phone'} method — the registration method used
 * Requirement: 6.2
 */
export async function logSignUp(method) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logSignUp({ method });
  } catch (error) {
    console.warn('[Analytics] Failed to log sign_up event:', error.message);
  }
}

/**
 * Log a login event.
 *
 * @param {'email' | 'phone'} method — the login method used
 * Requirement: 6.3
 */
export async function logLogin(method) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logLogin({ method });
  } catch (error) {
    console.warn('[Analytics] Failed to log login event:', error.message);
  }
}

/**
 * Log a custom vote_cast event.
 *
 * @param {string} productId  — the product that received the vote
 * @param {number} voteCount  — the updated vote count
 * Requirement: 6.4
 */
export async function logVoteCast(productId, voteCount) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logEvent('vote_cast', {
      product_id: productId,
      vote_count: voteCount,
    });
  } catch (error) {
    console.warn('[Analytics] Failed to log vote_cast event:', error.message);
  }
}

/**
 * Log a purchase event.
 *
 * @param {number} amount   — the transaction value
 * @param {string} currency — the ISO 4217 currency code (e.g. 'INR')
 * Requirement: 6.5
 */
export async function logPurchase(amount, currency) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logPurchase({
      value: amount,
      currency: currency,
    });
  } catch (error) {
    console.warn('[Analytics] Failed to log purchase event:', error.message);
  }
}

/**
 * Log a custom scan_product event.
 *
 * @param {string} barcode — the scanned barcode value
 * Requirement: 6.6
 */
export async function logScanProduct(barcode) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().logEvent('scan_product', {
      barcode_value: barcode,
    });
  } catch (error) {
    console.warn('[Analytics] Failed to log scan_product event:', error.message);
  }
}

/**
 * Set the Firebase Analytics user ID.
 *
 * @param {string | null} userId — the backend user ID, or null to clear
 * Requirement: 6.7
 */
export async function setUserId(userId) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().setUserId(userId);
  } catch (error) {
    console.warn('[Analytics] Failed to set user ID:', error.message);
  }
}

/**
 * Set one or more user properties on the Analytics instance.
 *
 * @param {Record<string, string | null>} properties — key/value pairs to set
 */
export async function setUserProperties(properties) {
  if (!isFirebaseInitialized()) return;

  try {
    await analytics().setUserProperties(properties);
  } catch (error) {
    console.warn('[Analytics] Failed to set user properties:', error.message);
  }
}
