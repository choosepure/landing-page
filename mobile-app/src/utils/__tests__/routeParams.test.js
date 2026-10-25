import fc from 'fast-check';
import { getParams, requireParam } from '../routeParams';

// Bug #4: screens destructure `route.params` directly (e.g. `const { phoneNumber } = route.params`).
// If a screen is reached without params (deep link, notification, restored nav state, bad push),
// `route.params` is `undefined` and the destructure throws
// "Cannot destructure property '...' of 'undefined'". These helpers guard that.

describe('getParams (bug #4: undefined route.params crash)', () => {
  it('returns defaults when route is undefined', () => {
    expect(getParams(undefined, { phoneNumber: null })).toEqual({ phoneNumber: null });
  });

  it('returns defaults when route.params is undefined', () => {
    expect(getParams({}, { reportId: null })).toEqual({ reportId: null });
  });

  it('returns empty object when no params and no defaults', () => {
    expect(getParams({})).toEqual({});
    expect(getParams(undefined)).toEqual({});
  });

  it('merges partial params over defaults', () => {
    const route = { params: { barcode: '123' } };
    expect(getParams(route, { barcode: null, product: null })).toEqual({
      barcode: '123',
      product: null,
    });
  });

  it('passes through params that are present', () => {
    const route = { params: { phoneNumber: '+919876543210' } };
    expect(getParams(route, { phoneNumber: null })).toEqual({
      phoneNumber: '+919876543210',
    });
  });

  it('does not mutate the defaults object', () => {
    const defaults = { reportId: null };
    getParams({ params: { reportId: 'abc' } }, defaults);
    expect(defaults).toEqual({ reportId: null });
  });

  it('never throws regardless of route shape (property)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.record({ params: fc.oneof(fc.constant(undefined), fc.object()) }),
          fc.object()
        ),
        (route) => {
          expect(() => getParams(route, { a: 1 })).not.toThrow();
        }
      )
    );
  });
});

describe('requireParam (bug #4: detect a missing required param)', () => {
  it('returns true when the required key is present and non-null', () => {
    expect(requireParam({ params: { reportId: 'abc' } }, 'reportId')).toBe(true);
  });

  it('returns false when route.params is undefined', () => {
    expect(requireParam({}, 'reportId')).toBe(false);
    expect(requireParam(undefined, 'reportId')).toBe(false);
  });

  it('returns false when the key is missing', () => {
    expect(requireParam({ params: { other: 1 } }, 'reportId')).toBe(false);
  });

  it('returns false when the key is null or undefined', () => {
    expect(requireParam({ params: { reportId: null } }, 'reportId')).toBe(false);
    expect(requireParam({ params: { reportId: undefined } }, 'reportId')).toBe(false);
  });

  it('treats empty string as missing', () => {
    expect(requireParam({ params: { barcode: '' } }, 'barcode')).toBe(false);
  });
});
