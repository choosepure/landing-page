/**
 * Firebase Cloud Messaging (FCM) Service
 *
 * Wraps Firebase Cloud Messaging operations for push notification
 * permission handling, device token management, and notification event
 * subscriptions (foreground messages, background taps, app-launch
 * notifications).
 *
 * All public functions check Firebase availability via the shared
 * `ensureFirebase` helper before accessing FCM APIs.
 */

import messaging from '@react-native-firebase/messaging';
import { isFirebaseInitialized } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure Firebase is available before performing a messaging operation.
 * Throws a descriptive error when Firebase has not been initialised.
 */
function ensureFirebase() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Messaging operations are unavailable.');
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request notification permission from the user (iOS and Android).
 *
 * On iOS this triggers the native permission dialog. On Android 13+
 * (`POST_NOTIFICATIONS`) the runtime permission prompt is shown.
 *
 * @returns {Promise<number>} The authorization status returned by Firebase:
 *   - `messaging.AuthorizationStatus.AUTHORIZED` (1)
 *   - `messaging.AuthorizationStatus.PROVISIONAL` (2)
 *   - `messaging.AuthorizationStatus.DENIED` (0)
 *   - `messaging.AuthorizationStatus.NOT_DETERMINED` (-1)
 */
export async function requestNotificationPermission() {
  ensureFirebase();

  const authorizationStatus = await messaging().requestPermission();
  return authorizationStatus;
}

/**
 * Retrieve the current FCM device token.
 *
 * The token uniquely identifies this device for push notification delivery.
 * It should be sent to the backend so the server can target this device.
 *
 * @returns {Promise<string>} The FCM device token.
 */
export async function getFCMToken() {
  ensureFirebase();

  const token = await messaging().getToken();
  return token;
}

/**
 * Subscribe to FCM token refresh events.
 *
 * The token can be rotated by FCM at any time. When it changes the new
 * token should be sent to the backend to keep notification delivery
 * working.
 *
 * @param {(newToken: string) => void} callback Called with the new token
 *   whenever FCM refreshes it.
 * @returns {() => void} Unsubscribe function — call to stop listening.
 */
export function onTokenRefresh(callback) {
  ensureFirebase();

  return messaging().onTokenRefresh(callback);
}

/**
 * Subscribe to foreground push notification messages.
 *
 * Called when a notification arrives while the app is in the foreground.
 * Use this to display an in-app banner or update UI without interrupting
 * the user.
 *
 * @param {(message: import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage) => void} callback
 *   Called with the remote message payload.
 * @returns {() => void} Unsubscribe function — call to stop listening.
 */
export function onForegroundMessage(callback) {
  ensureFirebase();

  return messaging().onMessage(callback);
}

/**
 * Handle notification taps when the app is in the background (but not
 * terminated).
 *
 * Called when the user taps a notification that was delivered while the
 * app was backgrounded. Use this to navigate to the relevant screen.
 *
 * @param {(message: import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage) => void} callback
 *   Called with the remote message payload that the user tapped.
 * @returns {() => void} Unsubscribe function — call to stop listening.
 */
export function onNotificationOpened(callback) {
  ensureFirebase();

  return messaging().onNotificationOpenedApp(callback);
}

/**
 * Check whether the app was launched by tapping a notification.
 *
 * When the app is in a terminated (killed) state and the user taps a
 * notification, this returns the notification payload that caused the
 * launch. Returns `null` if the app was opened normally.
 *
 * @returns {Promise<import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage | null>}
 *   The remote message that launched the app, or `null`.
 */
export async function getInitialNotification() {
  ensureFirebase();

  const remoteMessage = await messaging().getInitialNotification();
  return remoteMessage;
}

/**
 * Configure iOS foreground notification presentation options.
 *
 * Sets the app to display alerts, update badges, and play sounds when
 * notifications arrive while the app is in the foreground on iOS.
 * This is a no-op on Android.
 *
 * @returns {Promise<void>}
 */
export async function configureIOSForegroundPresentation() {
  ensureFirebase();

  await messaging().setForegroundNotificationPresentationOptions({
    alert: true,
    badge: true,
    sound: true,
  });
}
