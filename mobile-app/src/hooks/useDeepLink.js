import { useEffect } from 'react';
import * as Linking from 'expo-linking';

export default function useDeepLink(navigationRef) {
  useEffect(() => {
    function handleUrl({ url }) {
      if (!url || !navigationRef?.current) return;
      processUrl(url, navigationRef.current);
    }

    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url && navigationRef?.current) processUrl(url, navigationRef.current);
    });

    // Handle URLs while app is open
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [navigationRef]);
}

function processUrl(url, navigation) {
  try {
    const parsed = new URL(url.replace('choosepure://', 'https://choosepure.in/'));

    // Referral link: /purity-wall?ref=CP-XXXXX
    const ref = parsed.searchParams.get('ref');
    if (ref && /^CP-[A-Z0-9]{5}$/.test(ref)) {
      navigation.navigate('Register', { referralCode: ref });
      return;
    }

    // Password reset: /user/reset-password?token=XXXXX
    if (parsed.pathname.includes('reset-password')) {
      const token = parsed.searchParams.get('token');
      if (token) {
        navigation.navigate('ResetPassword', { token });
        return;
      }
    }
  } catch (e) {
    // Invalid URL — ignore
  }
}
