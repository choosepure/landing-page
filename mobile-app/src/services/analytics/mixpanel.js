import { Mixpanel } from 'mixpanel-react-native';

let mixpanel = null;

export const mixpanelAdapter = {
  name: 'mixpanel',

  async init(config) {
    if (!config.mixpanelToken) {
      throw new Error('Mixpanel token not provided');
    }
    mixpanel = new Mixpanel(config.mixpanelToken, true);
    await mixpanel.init();
  },

  async trackEvent(eventName, properties) {
    if (!mixpanel) return;
    mixpanel.track(eventName, properties);
  },

  async trackScreen(screenName, properties) {
    if (!mixpanel) return;
    mixpanel.track('screen_view', { screen_name: screenName, ...properties });
  },

  async identify(userId, traits) {
    if (!mixpanel) return;
    mixpanel.identify(userId);
    if (traits && typeof traits === 'object') {
      Object.entries(traits).forEach(([key, value]) => {
        if (value != null) mixpanel.getPeople().set(key, String(value));
      });
    }
  },

  async reset() {
    if (!mixpanel) return;
    mixpanel.reset();
  },
};
