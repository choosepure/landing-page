/**
 * Safe accessors for React Navigation `route.params`.
 *
 * Bug #4: screens that destructure `route.params` directly crash with
 * "Cannot destructure property '...' of 'undefined'" when reached without
 * params — e.g. via deep link, push notification, or restored navigation
 * state. These helpers make param access defensive.
 */

/**
 * Return a screen's params merged over a set of defaults.
 * Never throws, regardless of the shape of `route`.
 *
 * @param {object|undefined|null} route  The navigation route prop.
 * @param {object} [defaults={}]         Default values for expected params.
 * @returns {object} A new object: defaults with any present params layered on top.
 */
export function getParams(route, defaults = {}) {
  const params = route && route.params ? route.params : {};
  return { ...defaults, ...params };
}

/**
 * Check whether a required param is present and non-empty.
 * Treats `undefined`, `null`, and `''` as missing.
 *
 * @param {object|undefined|null} route  The navigation route prop.
 * @param {string} key                   The required param name.
 * @returns {boolean} true if the param exists and is non-empty.
 */
export function requireParam(route, key) {
  if (!route || !route.params) return false;
  const value = route.params[key];
  return value !== undefined && value !== null && value !== '';
}
