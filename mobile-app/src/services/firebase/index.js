/**
 * Firebase Initialization Module
 *
 * Verifies that the Firebase app is initialized (auto-initialized by the
 * native config plugin at app start) and exposes health-check helpers that
 * other Firebase service modules call before accessing Firebase APIs.
 *
 * Graceful degradation: when Firebase is unavailable the helpers return
 * safe fallback values and log a warning so the rest of the app can
 * continue operating against the existing backend API.
 */

import firebase from '@react-native-firebase/app';

/**
 * Check whether a default Firebase app instance exists.
 *
 * @returns {boolean} `true` when Firebase has been initialised, `false` otherwise.
 */
export function isFirebaseInitialized() {
  try {
    const apps = firebase.apps;
    return Array.isArray(apps) && apps.length > 0;
  } catch (error) {
    console.warn('[Firebase] Unable to check initialization status:', error.message);
    return false;
  }
}

/**
 * Return the default Firebase app instance, or `null` when Firebase is
 * not available.
 *
 * @returns {import('@react-native-firebase/app').FirebaseApp | null}
 */
export function getFirebaseApp() {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        '[Firebase] Firebase is not initialized. The app will continue with existing backend functionality.',
      );
      return null;
    }
    return firebase.app();
  } catch (error) {
    console.warn('[Firebase] Failed to retrieve Firebase app instance:', error.message);
    return null;
  }
}
