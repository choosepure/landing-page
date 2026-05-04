/**
 * Maps notification payload data to navigation actions.
 *
 * Payload format from FCM:
 *   { type: 'report' | 'poll' | 'subscription' | 'general', targetId: string }
 *
 * @param {object|null|undefined} notificationData - The data payload from a push notification.
 * @returns {{ screen: string, params: object } | null} Navigation action, or null if no data provided.
 */
export function getNavigationAction(notificationData) {
  if (notificationData == null) {
    return null;
  }

  const { type, targetId } = notificationData;

  switch (type) {
    case 'report':
      return { screen: 'ReportDetail', params: { reportId: targetId } };
    case 'poll':
      return { screen: 'Polling', params: { productId: targetId } };
    case 'subscription':
      return { screen: 'Subscription', params: {} };
    case 'general':
      return { screen: 'Dashboard', params: {} };
    default:
      return { screen: 'Dashboard', params: {} };
  }
}
