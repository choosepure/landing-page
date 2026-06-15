import analytics from '@react-native-firebase/analytics';
import { isFirebaseInitialized } from '../firebase';

export const firebaseAdapter = {
  name: 'firebase',

  async init() {
    // Firebase is auto-initialized via native config — no-op
  },

  async trackEvent(eventName, properties) {
    if (!isFirebaseInitialized()) return;
    await analytics().logEvent(eventName, properties);
  },

  async trackScreen(screenName, properties) {
    if (!isFirebaseInitialized()) return;
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: properties?.screen_class || screenName,
    });
  },

  async identify(userId, traits) {
    if (!isFirebaseInitialized()) return;
    await analytics().setUserId(userId);
    if (traits && typeof traits === 'object') {
      // Firebase only accepts string values for user properties
      const stringTraits = {};
      Object.entries(traits).forEach(([key, value]) => {
        if (value != null) stringTraits[key] = String(value);
      });
      await analytics().setUserProperties(stringTraits);
    }
  },

  async reset() {
    if (!isFirebaseInitialized()) return;
    await analytics().setUserId(null);
    await analytics().resetAnalyticsData();
  },
};
