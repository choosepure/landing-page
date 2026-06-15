import { Platform } from 'react-native';
import apiClient from '../../api/client';
import { META_BATCH_SIZE, META_FLUSH_INTERVAL } from '../../config/analytics';

let pixelId = null;
let eventQueue = [];
let flushTimer = null;
let userData = null;

export const metaAdapter = {
  name: 'meta',

  async init(config) {
    pixelId = config.metaPixelId;
    if (!pixelId) throw new Error('Meta Pixel ID not provided');
    // Start periodic flush timer
    flushTimer = setInterval(() => flush(), config.metaFlushInterval || META_FLUSH_INTERVAL);
  },

  async trackEvent(eventName, properties) {
    queueEvent(eventName, properties);
  },

  async trackScreen(screenName, properties) {
    queueEvent('page_view', { screen_name: screenName, ...properties });
  },

  async identify(userId, traits) {
    userData = { userId, traits: traits || {} };
  },

  async reset() {
    userData = null;
    await flush();
  },

  async flush() {
    await flush();
  },
};

function queueEvent(eventName, properties) {
  eventQueue.push({
    eventName,
    properties,
    timestamp: Date.now(),
    userId: userData?.userId || null,
    userData: userData?.traits || {},
  });

  // Trigger flush if batch is full
  if (eventQueue.length >= (META_BATCH_SIZE || 10)) {
    flush();
  }
}

async function flush() {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await apiClient.post('/api/analytics/events', {
      pixelId,
      events: batch,
      platform: Platform.OS,
      appVersion: '2.1.0',
    });
  } catch (error) {
    // Re-queue failed events for one retry
    if (!batch[0]._retried) {
      batch.forEach((e) => { e._retried = true; });
      eventQueue.unshift(...batch);
      // Enforce max queue size
      if (eventQueue.length > 2 * (META_BATCH_SIZE || 10)) {
        eventQueue = eventQueue.slice(0, 2 * (META_BATCH_SIZE || 10));
      }
    }
    // Second failure: events are dropped (already re-queued once)
  }
}
