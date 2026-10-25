/**
 * Firebase Crashlytics Service
 *
 * Provides crash-reporting helpers that wrap `@react-native-firebase/crashlytics`.
 * Every public function is a no-op when Firebase is not initialised, and failures
 * are caught and logged as warnings — crash reporting is non-critical and must
 * never crash the app.
 *
 * On module load, auto-collection is disabled in __DEV__ mode so that
 * development builds do not pollute production crash data.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import crashlytics from '@react-native-firebase/crashlytics';
import { isFirebaseInitialized } from './index';

/* ------------------------------------------------------------------ */
/*  Disable auto-collection in development builds (Requirement 7.5)   */
/* ------------------------------------------------------------------ */
try {
  if (typeof __DEV__ !== 'undefined') {
    crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
  }
} catch (error) {
  console.warn('[Crashlytics] Failed to configure auto-collection:', error.message);
}

/**
 * Set the user ID associated with crash reports.
 *
 * @param {string} userId — the backend user ID
 * Requirement: 7.2
 */
export async function setCrashlyticsUserId(userId) {
  if (!isFirebaseInitialized()) return;

  try {
    await crashlytics().setUserId(userId);
  } catch (error) {
    console.warn('[Crashlytics] Failed to set user ID:', error.message);
  }
}

/**
 * Add a breadcrumb log message to the next crash report.
 *
 * @param {string} message — the log message to record
 * Requirement: 7.3
 */
export async function logMessage(message) {
  if (!isFirebaseInitialized()) return;

  try {
    await crashlytics().log(message);
  } catch (error) {
    console.warn('[Crashlytics] Failed to log message:', error.message);
  }
}

/**
 * Record a non-fatal error with an optional context string.
 *
 * @param {Error}  error   — the error object to record
 * @param {string} [context] — additional context describing where the error occurred
 * Requirement: 7.1
 */
export async function recordError(error, context) {
  if (!isFirebaseInitialized()) return;

  try {
    if (context) {
      await crashlytics().setAttribute('context', context);
    }
    await crashlytics().recordError(error);
  } catch (err) {
    console.warn('[Crashlytics] Failed to record error:', err.message);
  }
}

/**
 * Record a non-fatal API error with custom attributes for the endpoint,
 * status code, and HTTP method.
 *
 * @param {string} endpoint   — the API endpoint path (e.g. "/api/polls/products")
 * @param {number} statusCode — the HTTP status code (e.g. 500)
 * @param {Error}  error      — the error object to record
 * Requirement: 7.4
 */
export async function recordAPIError(endpoint, statusCode, error) {
  if (!isFirebaseInitialized()) return;

  try {
    const instance = crashlytics();
    await instance.setAttribute('endpoint', String(endpoint));
    await instance.setAttribute('statusCode', String(statusCode));
    await instance.setAttribute('method', String(error?.config?.method || 'UNKNOWN').toUpperCase());
    await instance.recordError(
      error instanceof Error ? error : new Error(String(error)),
    );
  } catch (err) {
    console.warn('[Crashlytics] Failed to record API error:', err.message);
  }
}

/**
 * Enable or disable Crashlytics data collection at runtime.
 *
 * @param {boolean} enabled — `true` to enable, `false` to disable
 * Requirement: 7.5
 */
export async function setEnabled(enabled) {
  if (!isFirebaseInitialized()) return;

  try {
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
  } catch (error) {
    console.warn('[Crashlytics] Failed to set enabled state:', error.message);
  }
}
