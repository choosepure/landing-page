import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { getNavigationAction } from '../utils/notificationHandler';

const BANNER_HEIGHT = 90;
const AUTO_DISMISS_MS = 4000;
const ANIMATION_DURATION = 300;
const STATUS_BAR_PADDING = Platform.OS === 'ios' ? 44 : 24;

/**
 * Animated in-app notification banner that slides in from the top
 * when a foreground push notification arrives.
 *
 * Props:
 *   notification  – the FCM remoteMessage object (or null to hide)
 *   onDismiss     – called when the banner auto-dismisses or is tapped away
 *   onPress       – called with the navigation action when the user taps the banner
 */
export default function NotificationBanner({ notification, onDismiss, onPress }) {
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + STATUS_BAR_PADDING))).current;
  const dismissTimer = useRef(null);

  const slideOut = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -(BANNER_HEIGHT + STATUS_BAR_PADDING),
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  }, [translateY, onDismiss]);

  useEffect(() => {
    if (notification) {
      // Slide in
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      dismissTimer.current = setTimeout(() => {
        slideOut();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [notification, translateY, slideOut]);

  const handlePress = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    const action = getNavigationAction(notification?.data);
    if (onPress) onPress(action);

    slideOut();
  }, [notification, onPress, slideOut]);

  if (!notification) return null;

  const title = notification?.notification?.title || 'New Notification';
  const body = notification?.notification?.body || '';

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Notification: ${title}. ${body}`}
        accessibilityHint="Tap to open notification"
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: STATUS_BAR_PADDING,
    backgroundColor: theme.colors.cardBackground,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  body: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
