import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getScanHistory } from '../utils/scanHistory';
import apiClient from '../api/client';
import { trackEvent } from '../services/analytics';
import Card from '../components/Card';
import Icon from '../components/Icon';

const MENU_SECTIONS = [
  {
    group: 'Account',
    rows: [
      { icon: 'user', label: 'Edit profile', route: 'EditProfile' },
      { icon: 'bell', label: 'Notifications', route: 'Notifications' },
      { icon: 'shield-check', label: 'Legal', route: 'Legal' },
    ],
  },
  {
    group: 'Subscription',
    rows: [
      { icon: 'star', label: 'Plan & billing', route: 'ProfileSubscription' },
      { icon: 'gift', label: 'Refer & earn', route: 'Referral' },
    ],
  },
  {
    group: 'Support',
    rows: [
      { icon: 'help', label: 'Help center', route: 'HelpCenter' },
      { icon: 'star', label: 'Rate Choosepure', isRateApp: true },
      { icon: 'info', label: 'About Choosepure' },
      { icon: 'logout', label: 'Sign out', isSignOut: true },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [scanCount, setScanCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  // Refresh stats every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadStats() {
        // Scan count from local storage
        try {
          const history = await getScanHistory();
          if (!cancelled) setScanCount(history.length);
        } catch {
          // Keep at 0
        }

        // Referral count from backend
        try {
          const res = await apiClient.get('/api/user/referral-stats');
          if (!cancelled && res.data.success) {
            setReferralCount(res.data.completed ?? res.data.total_invited ?? 0);
          }
        } catch {
          // Keep at 0
        }
      }

      loadStats();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const isSubscribed = user?.subscriptionStatus === 'subscribed';

  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.choosepure.app';
  const APP_STORE_URL = 'https://apps.apple.com/app/choosepure/id6742605262';

  const handleRateApp = () => {
    trackEvent('rate_app_tapped');
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open store', 'Please search for "ChoosePure" in the ' + (Platform.OS === 'ios' ? 'App Store' : 'Play Store') + '.');
    });
  };

  const handleMenuPress = (row) => {
    if (row.isSignOut) {
      handleSignOut();
    } else if (row.isRateApp) {
      handleRateApp();
    } else if (row.route) {
      navigation.navigate(row.route);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <LinearGradient
            colors={['#B85C4D', '#7E2A1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
            {isSubscribed && (
              <View style={styles.subBadge}>
                <Text style={styles.subBadgeText}>Premium · Yearly</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            [String(scanCount), 'Scans'],
            [String(referralCount), 'Referrals'],
          ].map(([num, label]) => (
            <Card key={label} style={styles.statCell}>
              <Text style={styles.statNumber}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.group} style={styles.menuSection}>
            <Text style={styles.menuGroupLabel}>{section.group.toUpperCase()}</Text>
            <Card style={styles.menuCard}>
              {section.rows.map((row, i) => {
                const isLast = i === section.rows.length - 1;
                const isSignOut = row.isSignOut;
                const isRateApp = row.isRateApp;
                return (
                  <TouchableOpacity
                    key={row.label}
                    style={[
                      styles.menuRow,
                      !isLast && styles.menuRowBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleMenuPress(row)}
                  >
                    <Icon
                      name={row.icon}
                      size={20}
                      color={isSignOut ? theme.colors.error : isRateApp ? theme.colors.warning : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.menuRowLabel,
                        isSignOut && styles.menuRowLabelDanger,
                      ]}
                    >
                      {row.label}
                    </Text>
                    {!isSignOut && (
                      <Icon name="chevron-right" size={16} color={theme.colors.textDim} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Version */}
        <Text style={styles.versionText}>Choosepure v2.1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Profile card */
  profileCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
  },
  profileEmail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  subBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.green100,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  subBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary,
  },
  statLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },

  /* Menu sections */
  menuSection: {
    marginBottom: theme.spacing.md,
  },
  menuGroupLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  menuRowLabel: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  menuRowLabelDanger: {
    color: theme.colors.error,
  },

  /* Version */
  versionText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 4,
  },
});
