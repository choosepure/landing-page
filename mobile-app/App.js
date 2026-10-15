import 'react-native-gesture-handler';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import useDeepLink from './src/hooks/useDeepLink';
import { theme } from './src/theme';
import NotificationBanner from './src/components/NotificationBanner';
import {
  requestNotificationPermission,
  getFCMToken,
  onTokenRefresh,
  onForegroundMessage,
  onNotificationOpened,
  getInitialNotification,
  configureIOSForegroundPresentation,
} from './src/services/firebase/messaging';
import { getNavigationAction } from './src/utils/notificationHandler';
import { initRemoteConfig } from './src/services/firebase/remoteConfig';
import { configureGoogleSignIn } from './src/services/firebase/googleSignIn';
import { initAnalytics, trackScreen, flushMetaQueue } from './src/services/analytics';
import * as analyticsConfig from './src/config/analytics';
import ErrorBoundary from './src/components/ErrorBoundary';
import apiClient from './src/api/client';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const navigationRef = useRef(null);
  const isNavigationReady = useRef(false);
  const routeNameRef = useRef(null);
  const [foregroundNotification, setForegroundNotification] = useState(null);

  useDeepLink(navigationRef);

  const onNavigationReady = useCallback(() => {
    isNavigationReady.current = true;
    // Set the initial route name for screen tracking
    const initialRouteName = navigationRef.current?.getCurrentRoute()?.name;
    routeNameRef.current = initialRouteName;
  }, []);

  const onNavigationStateChange = useCallback(() => {
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
    const previousRouteName = routeNameRef.current;

    if (currentRouteName && currentRouteName !== previousRouteName) {
      trackScreen(currentRouteName, { previous_screen: previousRouteName });
    }

    routeNameRef.current = currentRouteName;
  }, []);

  // -----------------------------------------------------------------------
  // FCM integration – runs once on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribers = [];

    async function setupFCM() {
      // Initialize unified analytics (Firebase + Mixpanel + Meta)
      try {
        await initAnalytics({
          mixpanelToken: analyticsConfig.MIXPANEL_TOKEN,
          metaPixelId: analyticsConfig.META_PIXEL_ID,
          metaBatchSize: analyticsConfig.META_BATCH_SIZE,
          metaFlushInterval: analyticsConfig.META_FLUSH_INTERVAL,
          debug: analyticsConfig.DEBUG,
        });
      } catch (err) {
        console.warn('[Analytics] Failed to initialize:', err);
      }

      // Initialize Remote Config early so feature flags are available ASAP
      try {
        await initRemoteConfig();
      } catch (err) {
        console.warn('[RemoteConfig] Failed to initialize Remote Config:', err);
      }

      // Configure Google Sign-In
      configureGoogleSignIn();

      try {
        // Configure iOS foreground notification presentation (no-op on Android)
        await configureIOSForegroundPresentation();
      } catch (err) {
        console.warn('[FCM] Failed to configure iOS foreground presentation:', err);
      }

      try {
        // Request notification permission
        const status = await requestNotificationPermission();

        // messaging.AuthorizationStatus.AUTHORIZED === 1
        // messaging.AuthorizationStatus.PROVISIONAL === 2
        const permissionGranted = status === 1 || status === 2;

        if (permissionGranted) {
          try {
            const token = await getFCMToken();
            // Send token to backend
            await apiClient.post('/api/user/fcm-token', {
              token,
              platform: Platform.OS,
            });
          } catch (tokenErr) {
            console.warn('[FCM] Failed to get/send FCM token:', tokenErr);
          }
        }
      } catch (permErr) {
        console.warn('[FCM] Failed to request notification permission:', permErr);
      }

      // Subscribe to token refresh – send updated token to backend
      try {
        const unsubTokenRefresh = onTokenRefresh(async (newToken) => {
          try {
            await apiClient.post('/api/user/fcm-token', {
              token: newToken,
              platform: Platform.OS,
            });
          } catch (err) {
            console.warn('[FCM] Failed to send refreshed token to backend:', err);
          }
        });
        unsubscribers.push(unsubTokenRefresh);
      } catch (err) {
        console.warn('[FCM] Failed to set up token refresh listener:', err);
      }

      // Subscribe to foreground messages – show in-app banner
      try {
        const unsubForeground = onForegroundMessage((remoteMessage) => {
          setForegroundNotification(remoteMessage);
        });
        unsubscribers.push(unsubForeground);
      } catch (err) {
        console.warn('[FCM] Failed to set up foreground message listener:', err);
      }

      // Subscribe to background notification taps – navigate to target screen
      try {
        const unsubNotifOpened = onNotificationOpened((remoteMessage) => {
          const action = getNavigationAction(remoteMessage?.data);
          if (action && navigationRef.current) {
            navigationRef.current.navigate(action.screen, action.params);
          }
        });
        unsubscribers.push(unsubNotifOpened);
      } catch (err) {
        console.warn('[FCM] Failed to set up notification opened listener:', err);
      }

      // Check for initial notification (app launched from terminated state)
      try {
        const initialNotification = await getInitialNotification();
        if (initialNotification) {
          const action = getNavigationAction(initialNotification?.data);
          if (action && navigationRef.current) {
            navigationRef.current.navigate(action.screen, action.params);
          }
        }
      } catch (err) {
        console.warn('[FCM] Failed to get initial notification:', err);
      }
    }

    setupFCM();

    // Flush Meta analytics queue on app background
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        flushMetaQueue();
      }
    });

    // Cleanup all listeners on unmount
    return () => {
      appStateSubscription.remove();
      unsubscribers.forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, []);

  // -----------------------------------------------------------------------
  // Notification banner handlers
  // -----------------------------------------------------------------------
  const handleBannerDismiss = useCallback(() => {
    setForegroundNotification(null);
  }, []);

  const handleBannerPress = useCallback(
    (action) => {
      setForegroundNotification(null);
      if (action && navigationRef.current) {
        navigationRef.current.navigate(action.screen, action.params);
      }
    },
    [],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationBanner
          notification={foregroundNotification}
          onDismiss={handleBannerDismiss}
          onPress={handleBannerPress}
        />
        <NavigationContainer ref={navigationRef} onReady={onNavigationReady} onStateChange={onNavigationStateChange}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7' },
});
