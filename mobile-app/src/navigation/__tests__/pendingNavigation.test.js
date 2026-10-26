/**
 * Bug #5 — deep links and notification taps fired before the NavigationContainer
 * was ready were dropped (cold start). This queue holds a single pending target
 * until navigation is ready, then flushes it exactly once. Navigations issued
 * after ready go straight through.
 */
import {
  navigateWhenReady,
  setNavigationReady,
  __resetForTests,
} from '../pendingNavigation';

function makeRef() {
  const navigate = jest.fn();
  return { ref: { current: { navigate } }, navigate };
}

describe('pendingNavigation queue (bug #5)', () => {
  beforeEach(() => __resetForTests());

  it('queues a navigation issued before ready (does not navigate yet)', () => {
    const { ref, navigate } = makeRef();
    navigateWhenReady(ref, 'ReportDetail', { reportId: 'r1' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('flushes the queued target exactly once when ready', () => {
    const { ref, navigate } = makeRef();
    navigateWhenReady(ref, 'ReportDetail', { reportId: 'r1' });
    setNavigationReady(ref);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('ReportDetail', { reportId: 'r1' });
  });

  it('does not re-navigate if setNavigationReady fires again (no double-navigation)', () => {
    const { ref, navigate } = makeRef();
    navigateWhenReady(ref, 'ReportDetail', { reportId: 'r1' });
    setNavigationReady(ref);
    setNavigationReady(ref); // e.g. remount / second onReady
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('navigates straight through when already ready', () => {
    const { ref, navigate } = makeRef();
    setNavigationReady(ref);
    navigateWhenReady(ref, 'Polling', { productId: 'p1' });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('Polling', { productId: 'p1' });
  });

  it('keeps only the latest pending target when several queue before ready', () => {
    const { ref, navigate } = makeRef();
    navigateWhenReady(ref, 'ReportDetail', { reportId: 'r1' });
    navigateWhenReady(ref, 'ResetPassword', { token: 't2' });
    setNavigationReady(ref);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('ResetPassword', { token: 't2' });
  });

  it('is a no-op when ready but the ref has no current navigator', () => {
    const emptyRef = { current: null };
    setNavigationReady(emptyRef);
    expect(() => navigateWhenReady(emptyRef, 'Dashboard', {})).not.toThrow();
  });
});
