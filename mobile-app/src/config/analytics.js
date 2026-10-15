/**
 * Analytics configuration for the ChoosePure mobile app.
 * Provides tokens and settings for Mixpanel and Meta integrations.
 */

// Mixpanel project token (same as website)
export const MIXPANEL_TOKEN = '6921e08f65e4331fdd48e6a18a822ab4';

// Meta/Facebook Pixel ID (same as website)
export const META_PIXEL_ID = '3534907673428830';

// Number of events to accumulate before triggering a batch flush to Meta
export const META_BATCH_SIZE = 10;

// Interval in milliseconds between automatic Meta batch flushes
export const META_FLUSH_INTERVAL = 30000;

// Enable debug logging in development mode
export const DEBUG = __DEV__;
