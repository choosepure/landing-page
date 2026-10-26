import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { navigateWhenReady } from '../navigation/pendingNavigation';

export default function useDeepLink(navigationRef) {
  useEffect(() => {
    function handleUrl({ url }) {
      if (!url) return;
      processUrl(url, navigationRef);
    }

    // Handle URL that opened the app (cold start). The navigator may not be
    // ready yet — navigateWhenReady queues the target until it is.
    Linking.getInitialURL().then((url) => {
      if (url) processUrl(url, navigationRef);
    });

    // Handle URLs while the app is open (warm).
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [navigationRef]);
}

function processUrl(url, navigationRef) {
  try {
    const parsed = new URL(url.replace('choosepure://', 'https://choosepure.in/'));

    // Referral link: /purity-wall?ref=CP-XXXXX
    const ref = parsed.searchParams.get('ref');
    if (ref && /^CP-[A-Z0-9]{5}$/.test(ref)) {
      navigateWhenReady(navigationRef, 'Register', { referralCode: ref });
      return;
    }

    // Password reset: /user/reset-password?token=XXXXX
    if (parsed.pathname.includes('reset-password')) {
      const token = parsed.searchParams.get('token');
      if (token) {
        navigateWhenReady(navigationRef, 'ResetPassword', { token });
        return;
      }
    }
  } catch (e) {
    // Invalid URL — ignore
  }
}
