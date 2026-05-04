import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, Share, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function ReferralScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/user/referral-stats');
        setStats(res.data);
      } catch (e) {
        Alert.alert('Error', 'Failed to load referral stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShare = async () => {
    if (!stats?.referral_link) return;
    try {
      await Share.share({
        message: `Join ChoosePure and get access to independent food purity reports! Use my referral link: ${stats.referral_link}`,
      });
    } catch (e) { /* user cancelled */ }
  };

  const handleCopy = async () => {
    if (!stats?.referral_code) return;
    await Clipboard.setStringAsync(stats.referral_code);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load referral data.</Text>
      </View>
    );
  }

  const earnings = stats.earnings ?? '$0';
  const friendCount = stats.completed ?? 0;
  const recentActivity = stats.recent_activity ?? [];

  const HOW_IT_WORKS = [
    ['Share your code', 'Send your code to friends via any app.'],
    ['They sign up', 'Friend creates an account using your code.'],
    ['You both earn', 'You get credit, friend gets a discount on premium.'],
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Green gradient banner */}
        <LinearGradient
          colors={['#226342', '#2D7A52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerIconCircle}>
            <Icon name="gift" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.bannerLabel}>You've earned</Text>
          <Text style={styles.bannerAmount}>{typeof earnings === 'number' ? `$${earnings}` : earnings}</Text>
          <Text style={styles.bannerFriends}>
            From {friendCount} friend{friendCount !== 1 ? 's' : ''} who joined
          </Text>
        </LinearGradient>

        {/* Referral code box */}
        <Card style={styles.codeCard}>
          <Text style={styles.sectionLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{stats.referral_code}</Text>
            </View>
            <Button variant="secondary" size="md" onPress={handleCopy}>
              Copy
            </Button>
          </View>
        </Card>

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {HOW_IT_WORKS.map(([title, body], i) => (
            <View key={title} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepBody}>{body}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <Card style={styles.activityCard}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }]}>
              RECENT ACTIVITY
            </Text>
            {recentActivity.map((item, i) => {
              const name = item.name || 'Friend';
              const initial = name.charAt(0).toUpperCase();
              const when = item.date || '';
              const amt = item.amount || '';
              return (
                <View
                  key={`${name}-${i}`}
                  style={[
                    styles.activityRow,
                    i < recentActivity.length - 1 && styles.activityRowBorder,
                  ]}
                >
                  <View style={styles.activityAvatar}>
                    <Text style={styles.activityInitial}>{initial}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{name}</Text>
                    <Text style={styles.activityDate}>{when}</Text>
                  </View>
                  <Text style={styles.activityAmount}>{amt}</Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* Share button */}
        <Button variant="primary" size="lg" fullWidth onPress={handleShare}>
          <View style={styles.shareRow}>
            <Icon name="share" size={18} color="#FFFFFF" />
            <Text style={styles.shareText}>Share with friends</Text>
          </View>
        </Button>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
  },

  /* Banner */
  banner: {
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  bannerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bannerLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 4,
    opacity: 0.8,
    marginBottom: 4,
  },
  bannerAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['4xl'],
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerFriends: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  /* Code box */
  codeCard: {
    padding: 16,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBox: {
    flex: 1,
    backgroundColor: theme.colors.green50,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    letterSpacing: 3,
  },

  /* How it works */
  howCard: {
    padding: 16,
    marginBottom: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  stepBody: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Recent activity */
  activityCard: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInitial: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  activityDate: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  activityAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.primaryLight,
  },

  /* Share button */
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
  },
});
