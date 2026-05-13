import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';
import Icon from '../components/Icon';
import {
  requestNotificationPermission,
  getFCMToken,
} from '../services/firebase/messaging';

const NOTIF_ENABLED_KEY = 'notifications_enabled';

export default function NotificationsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
      // Default to true if never set (notifications are on by default)
      setEnabled(stored === null ? true : stored === 'true');
    } catch {
      setEnabled(true);
    } finally {
      setLoading(false);
    }
  }

  const handleToggle = useCallback(async (newValue) => {
    setToggling(true);
    try {
      if (newValue) {
        // Enable: request permission and register token
        const status = await requestNotificationPermission();
        const permissionGranted = status === 1 || status === 2;

        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'Notifications are blocked at the system level. Please enable them in your device Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setToggling(false);
          return;
        }

        const token = await getFCMToken();
        await apiClient.post('/api/user/fcm-token', {
          token,
          platform: Platform.OS,
        });

        setEnabled(true);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      } else {
        // Disable: remove token from backend
        let token = null;
        try {
          token = await getFCMToken();
        } catch {
          // If we can't get the token, still mark as disabled locally
        }

        if (token) {
          await apiClient.delete('/api/user/fcm-token', {
            data: { token },
          });
        }

        setEnabled(false);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setToggling(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main toggle */}
      <Card style={styles.card}>
        <View style={styles.row}>
          <Icon name="bell" size={22} color={theme.colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Push Notifications</Text>
            <Text style={styles.rowSubtitle}>
              Receive alerts for new reports, voting reminders, and updates
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#D1D1D1', true: theme.colors.primaryLight || '#95DB93' }}
              thumbColor={enabled ? theme.colors.primary : '#F4F4F4'}
            />
          )}
        </View>
      </Card>

      {/* Info about what notifications include */}
      <Text style={styles.sectionLabel}>WHAT YOU'LL RECEIVE</Text>
      <Card style={styles.card}>
        {NOTIFICATION_TYPES.map((item, i) => {
          const isLast = i === NOTIFICATION_TYPES.length - 1;
          return (
            <View key={item.title} style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
              <Text style={styles.infoEmoji}>{item.emoji}</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoDesc}>{item.description}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Status note */}
      <Text style={styles.statusNote}>
        {enabled
          ? '✅ Notifications are enabled. You will receive push alerts on this device.'
          : '🔕 Notifications are disabled. You won\'t receive any push alerts.'}
      </Text>
    </View>
  );
}

const NOTIFICATION_TYPES = [
  {
    emoji: '🧪',
    title: 'New Reports',
    description: 'When a new purity report is published',
  },
  {
    emoji: '🗳️',
    title: 'Voting Reminders',
    description: 'When a new voting cycle opens',
  },
  {
    emoji: '🎁',
    title: 'Referral Updates',
    description: 'When a friend signs up using your code',
  },
  {
    emoji: '💳',
    title: 'Subscription Alerts',
    description: 'Renewal reminders and plan updates',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Card */
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },

  /* Main toggle row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  /* Section label */
  sectionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  infoEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  infoDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },

  /* Status note */
  statusNote: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
