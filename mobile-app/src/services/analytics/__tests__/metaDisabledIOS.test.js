/**
 * C2 / privacy — the Meta analytics adapter must be DISABLED on iOS (it forwards
 * app data to Facebook for ad measurement = tracking under Apple ATT, and we
 * ship no ATT prompt). It must remain ENABLED on Android.
 *
 * We assert on the registered adapter list (ALL_ADAPTERS), which is the single
 * source of truth for what gets init'd and what receives track/identify/reset.
 */

// Mock the adapters so importing the analytics index doesn't pull native deps.
jest.mock('../firebase', () => ({ firebaseAdapter: { name: 'firebase' } }));
jest.mock('../mixpanel', () => ({ mixpanelAdapter: { name: 'mixpanel' } }));
jest.mock('../meta', () => ({ metaAdapter: { name: 'meta', flush: jest.fn() } }));

function loadAdaptersFor(os) {
  let names;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    // eslint-disable-next-line global-require
    const mod = require('../index');
    names = mod.ALL_ADAPTERS.map((a) => a.name);
  });
  jest.dontMock('react-native');
  return names;
}

describe('C2: Meta adapter disabled on iOS, enabled on Android', () => {
  it('does NOT register the meta adapter on iOS', () => {
    const names = loadAdaptersFor('ios');
    expect(names).toEqual(['firebase', 'mixpanel']);
    expect(names).not.toContain('meta');
  });

  it('registers the meta adapter on Android', () => {
    const names = loadAdaptersFor('android');
    expect(names).toContain('meta');
    expect(names).toEqual(['firebase', 'mixpanel', 'meta']);
  });

  it('flushMetaQueue is a no-op on iOS (does not call meta.flush)', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
      const meta = require('../meta').metaAdapter;
      const mod = require('../index');
      mod.flushMetaQueue();
      expect(meta.flush).not.toHaveBeenCalled();
    });
    jest.dontMock('react-native');
  });
});
