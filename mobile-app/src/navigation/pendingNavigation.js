/**
 * Navigation-readiness gate (bug #5).
 *
 * Deep links (expo-linking) and notification taps (FCM getInitialNotification /
 * onNotificationOpenedApp) can fire before React Navigation's container is
 * ready — most notably on a COLD start, where the target arrives while the
 * NavigationContainer is still mounting. Calling navigate() then silently drops
 * the navigation, leaving the user on the default screen.
 *
 * This module queues a single pending target until navigation is ready, then
 * flushes it exactly once. Targets issued after ready navigate immediately.
 * A single pending slot is intentional: if multiple targets arrive before
 * ready, the most recent one wins (the user's latest intent).
 */

let isReady = false;
let pendingTarget = null; // { screen, params } | null

function doNavigate(navigationRef, screen, params) {
  const nav = navigationRef && navigationRef.current;
  if (nav && typeof nav.navigate === 'function') {
    nav.navigate(screen, params);
  }
}

/**
 * Navigate now if the container is ready; otherwise remember the target and
 * flush it when setNavigationReady() is called.
 *
 * @param {{current: any}} navigationRef - React Navigation container ref.
 * @param {string} screen - Target route name.
 * @param {object} [params] - Route params.
 */
export function navigateWhenReady(navigationRef, screen, params = {}) {
  if (!screen) return;
  if (isReady) {
    doNavigate(navigationRef, screen, params);
  } else {
    pendingTarget = { screen, params };
  }
}

/**
 * Mark navigation as ready and flush any pending target exactly once.
 * Safe to call more than once (e.g. a remount firing onReady again): the
 * pending target is cleared on first flush so it never double-navigates.
 *
 * @param {{current: any}} navigationRef - React Navigation container ref.
 */
export function setNavigationReady(navigationRef) {
  isReady = true;
  if (pendingTarget) {
    const { screen, params } = pendingTarget;
    pendingTarget = null; // clear BEFORE navigating so it can't flush twice
    doNavigate(navigationRef, screen, params);
  }
}

/** Test-only: reset module state between tests. */
export function __resetForTests() {
  isReady = false;
  pendingTarget = null;
}
