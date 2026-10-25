import { getNavigationAction } from '../notificationHandler';

describe('getNavigationAction', () => {
  it('returns null when notificationData is null', () => {
    expect(getNavigationAction(null)).toBeNull();
  });

  it('returns null when notificationData is undefined', () => {
    expect(getNavigationAction(undefined)).toBeNull();
  });

  it('maps "report" type to ReportDetail screen with reportId', () => {
    const result = getNavigationAction({ type: 'report', targetId: 'rpt-123' });
    expect(result).toEqual({ screen: 'ReportDetail', params: { reportId: 'rpt-123' } });
  });

  it('maps "poll" type to Polling screen with productId', () => {
    const result = getNavigationAction({ type: 'poll', targetId: 'prod-456' });
    expect(result).toEqual({ screen: 'Polling', params: { productId: 'prod-456' } });
  });

  it('maps "subscription" type to Subscription screen with empty params', () => {
    const result = getNavigationAction({ type: 'subscription', targetId: 'sub-789' });
    expect(result).toEqual({ screen: 'Subscription', params: {} });
  });

  it('maps "general" type to Dashboard screen with empty params', () => {
    const result = getNavigationAction({ type: 'general' });
    expect(result).toEqual({ screen: 'Dashboard', params: {} });
  });

  it('defaults to Dashboard for unknown type', () => {
    const result = getNavigationAction({ type: 'promo', targetId: 'x' });
    expect(result).toEqual({ screen: 'Dashboard', params: {} });
  });

  it('defaults to Dashboard when type is missing', () => {
    const result = getNavigationAction({ targetId: 'abc' });
    expect(result).toEqual({ screen: 'Dashboard', params: {} });
  });

  it('defaults to Dashboard when data is an empty object', () => {
    const result = getNavigationAction({});
    expect(result).toEqual({ screen: 'Dashboard', params: {} });
  });
});
