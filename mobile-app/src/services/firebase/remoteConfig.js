/**
 * Firebase Remote Config Service
 *
 * Wraps Firebase Remote Config operations for feature flag management
 * and A/B testing. Provides default values for all feature flags so the
 * app functions correctly offline or before the first fetch completes.
 *
 * All public functions check Firebase availability via the shared
 * `ensureFirebase` helper before accessing Remote Config APIs.
 */

import remoteConfig from '@react-native-firebase/remote-config';
import { isFirebaseInitialized } from './index';

// ---------------------------------------------------------------------------
// Default feature flag values
// ---------------------------------------------------------------------------

/**
 * Default values for all feature flags. These are used when the device is
 * offline, before the first fetch completes, or when Remote Config is
 * unavailable.
 */
export const DEFAULTS = {
  new_scanner_enabled: false,
  referral_bonus_amount: 50,
  polling_realtime_enabled: true,
  show_subscription_banner: true,
  maintenance_mode: false,
  min_app_version: '1.0.0',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure Firebase is available before performing a Remote Config operation.
 * Throws a descriptive error when Firebase has not been initialised.
 */
function ensureFirebase() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Remote Config operations are unavailable.');
  }
}

/**
 * Resolve a Remote Config value to the correct JavaScript type based on
 * the type of the corresponding default value.
 *
 * @param {import('@react-native-firebase/remote-config').FirebaseRemoteConfigTypes.ConfigValue} configValue
 *   The raw Remote Config value object.
 * @param {*} defaultValue  The default value whose type determines the
 *   return type.
 * @returns {boolean | number | string} The resolved value.
 */
function resolveValue(configValue, defaultValue) {
  switch (typeof defaultValue) {
    case 'boolean':
      return configValue.asBoolean();
    case 'number':
      return configValue.asNumber();
    case 'string':
    default:
      return configValue.asString();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise Firebase Remote Config with default values and fetch the
 * latest configuration from the server.
 *
 * - Sets all default feature flag values so the app works offline.
 * - Configures the minimum fetch interval: 0 seconds in development
 *   (for rapid iteration) and 12 hours (43 200 s) in production.
 * - Fetches and activates the latest remote values.
 *
 * Wrapped in a try/catch so a fetch failure never crashes the app —
 * the SDK will fall back to the last fetched values or the defaults.
 *
 * @returns {Promise<void>}
 */
export async function initRemoteConfig() {
  ensureFirebase();

  try {
    await remoteConfig().setDefaults(DEFAULTS);

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 43200000, // 0 for dev, 12 hours for production
    });

    await remoteConfig().fetchAndActivate();
  } catch (error) {
    console.warn('[RemoteConfig] Failed to fetch remote config:', error.message);
    // Graceful failure — the app continues with defaults or last-fetched values
  }
}

/**
 * Get the current value of a feature flag.
 *
 * Returns the remotely fetched value if available, otherwise falls back
 * to the registered default. Never returns `undefined` or `null`.
 *
 * @param {string} key  The feature flag key (must exist in {@link DEFAULTS}).
 * @returns {boolean | number | string} The current flag value.
 */
export function getFeatureFlag(key) {
  if (!isFirebaseInitialized()) {
    return DEFAULTS[key] !== undefined ? DEFAULTS[key] : false;
  }

  try {
    const value = remoteConfig().getValue(key);

    // If the value source is 'default' or 'remote', resolve using the
    // default's type. If the key is unknown, fall back to DEFAULTS.
    if (key in DEFAULTS) {
      return resolveValue(value, DEFAULTS[key]);
    }

    // Unknown key — return the string representation or false
    return value.asString() || false;
  } catch (error) {
    console.warn(`[RemoteConfig] Failed to get flag "${key}":`, error.message);
    return DEFAULTS[key] !== undefined ? DEFAULTS[key] : false;
  }
}

/**
 * Get all current feature flag values as a plain object.
 *
 * Iterates over every key in {@link DEFAULTS} and resolves each to its
 * current value (remote or default).
 *
 * @returns {{ [key: string]: boolean | number | string }} An object
 *   mapping every registered flag key to its current value.
 */
export function getAllFlags() {
  const flags = {};

  for (const key of Object.keys(DEFAULTS)) {
    flags[key] = getFeatureFlag(key);
  }

  return flags;
}
