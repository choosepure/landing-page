/**
 * Unified Analytics Service
 *
 * Central entry point for all analytics calls in the ChoosePure mobile app.
 * Fans out events to all registered provider adapters (Firebase, Mixpanel, Meta)
 * using Promise.allSettled for fault isolation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2,
 *              4.3, 5.1, 6.1, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3
 */

import { Platform } from 'react-native';
import { DEBUG } from '../../config/analytics';
import { firebaseAdapter } from './firebase';
import { mixpanelAdapter } from './mixpanel';
import { metaAdapter } from './meta';

const ALL_ADAPTERS = [firebaseAdapter, mixpanelAdapter, metaAdapter];
let adapters = [];
let initialized = false;

/** Valid event name pattern: starts with lowercase letter, followed by 0-39 lowercase alphanumeric or underscore chars */
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;

/**
 * Initialize all analytics providers. Call once in App.js on mount.
 * Uses Promise.allSettled to ensure one adapter failure doesn't block others.
 *
 * @param {Object} config - AnalyticsConfig object
 * @returns {Promise<void>}
 */
export async function initAnalytics(config) {
  const results = await Promise.allSettled(
    ALL_ADAPTERS.map((adapter) => adapter.init(config))
  );

  // Only register successfully initialized adapters
  adapters = ALL_ADAPTERS.filter((_, i) => results[i].status === 'fulfilled');
  initialized = true;

  if (__DEV__) {
    console.log('[Analytics] Initialized adapters:', adapters.map((a) => a.name));
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Analytics] ${ALL_ADAPTERS[i].name} init failed:`,
          result.reason
        );
      }
    });
  }
}

/**
 * Track a named event with optional properties.
 * Validates event name, enriches properties, and dispatches to all adapters.
 *
 * @param {string} eventName - Snake_case event name matching /^[a-z][a-z0-9_]{0,39}$/
 * @param {Record<string, any>} [properties={}] - Event properties
 * @returns {Promise<void>}
 */
export async function trackEvent(eventName, properties = {}) {
  // Pre-initialization safety: no-op if not initialized
  if (!initialized) return;

  // Event name validation
  if (!eventName || typeof eventName !== 'string' || !EVENT_NAME_PATTERN.test(eventName)) {
    if (__DEV__) {
      console.warn('[Analytics] Invalid event name:', eventName);
    }
    return;
  }

  // Enrich properties with metadata
  const enrichedProps = {
    ...properties,
    timestamp: Date.now(),
    platform: Platform.OS,
    app_version: '2.1.0',
  };

  if (__DEV__) {
    console.log(`[Analytics] trackEvent: ${eventName}`, enrichedProps);
  }

  // Fan out to all adapters in parallel; never throw
  const results = await Promise.allSettled(
    adapters.map((adapter) => adapter.trackEvent(eventName, enrichedProps))
  );

  // Log failures in dev mode
  if (__DEV__) {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Analytics][${adapters[i].name}] trackEvent failed:`,
          result.reason
        );
      }
    });
  }
}

/**
 * Track a screen view. Dispatches to all adapters.
 *
 * @param {string} screenName - Name of the screen
 * @param {Record<string, any>} [properties={}] - Additional properties
 * @returns {Promise<void>}
 */
export async function trackScreen(screenName, properties = {}) {
  // Pre-initialization safety: no-op if not initialized
  if (!initialized) return;

  if (__DEV__) {
    console.log(`[Analytics] trackScreen: ${screenName}`, properties);
  }

  const results = await Promise.allSettled(
    adapters.map((adapter) => adapter.trackScreen(screenName, properties))
  );

  if (__DEV__) {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Analytics][${adapters[i].name}] trackScreen failed:`,
          result.reason
        );
      }
    });
  }
}

/**
 * Identify a user across all providers.
 *
 * @param {string} userId - Unique user ID
 * @param {Record<string, any>} [traits={}] - User traits (email, name, etc.)
 * @returns {Promise<void>}
 */
export async function identify(userId, traits = {}) {
  // Pre-initialization safety: no-op if not initialized
  if (!initialized) return;

  if (__DEV__) {
    console.log(`[Analytics] identify: ${userId}`, traits);
  }

  const results = await Promise.allSettled(
    adapters.map((adapter) => adapter.identify(userId, traits))
  );

  if (__DEV__) {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Analytics][${adapters[i].name}] identify failed:`,
          result.reason
        );
      }
    });
  }
}

/**
 * Reset/logout across all providers.
 *
 * @returns {Promise<void>}
 */
export async function reset() {
  // Pre-initialization safety: no-op if not initialized
  if (!initialized) return;

  if (__DEV__) {
    console.log('[Analytics] reset');
  }

  const results = await Promise.allSettled(
    adapters.map((adapter) => adapter.reset())
  );

  if (__DEV__) {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Analytics][${adapters[i].name}] reset failed:`,
          result.reason
        );
      }
    });
  }
}

/**
 * Flush the Meta adapter's event queue.
 * Call this when the app transitions to background to prevent data loss.
 *
 * @returns {Promise<void>}
 */
export async function flushMetaQueue() {
  if (metaAdapter && typeof metaAdapter.flush === 'function') {
    try {
      await metaAdapter.flush();
    } catch (error) {
      if (__DEV__) {
        console.warn('[Analytics] Meta flush failed:', error);
      }
    }
  }
}
