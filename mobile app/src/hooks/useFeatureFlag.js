/**
 * useFeatureFlag Hook
 *
 * Reads a feature flag value from Firebase Remote Config.
 * Falls back to the provided `defaultValue` when Remote Config
 * is unavailable or the key has not been fetched yet.
 * Guarantees a non-null, non-undefined return value.
 *
 * @example
 *   const scannerEnabled = useFeatureFlag('new_scanner_enabled', false);
 */

import { useState, useEffect } from 'react';
import { getFeatureFlag } from '../services/firebase/remoteConfig';

/**
 * @param {string} key           The Remote Config feature flag key.
 * @param {boolean|number|string} defaultValue
 *   Value to use when the flag cannot be resolved. Falls back to `false`
 *   when `defaultValue` itself is undefined or null.
 * @returns {boolean|number|string} The current flag value — never
 *   `undefined` or `null`.
 */
export function useFeatureFlag(key, defaultValue) {
  const safeFallback = defaultValue !== undefined && defaultValue !== null
    ? defaultValue
    : false;

  const [value, setValue] = useState(() => {
    try {
      const remote = getFeatureFlag(key);
      return remote !== undefined && remote !== null ? remote : safeFallback;
    } catch {
      return safeFallback;
    }
  });

  useEffect(() => {
    try {
      const remote = getFeatureFlag(key);
      const resolved = remote !== undefined && remote !== null
        ? remote
        : safeFallback;
      setValue(resolved);
    } catch {
      setValue(safeFallback);
    }
  }, [key, safeFallback]);

  return value;
}
