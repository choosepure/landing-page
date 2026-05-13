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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/user/referral-stats');
        if (res.data.success) {
          setStats(res.data);
        } else {
          Alert.alert('Error', 'Failed to load referral stats.');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load referral stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShareWhatsApp = async () => {
    if (!stats?.referral_link) return;
    try {
      await Share.share({
        message: `Join ChoosePure – independent lab-tested purity reports for everyday food! Sign up with my link and we both get a free month of Premium: ${stats.referral_link}`,
      });
    } catch (e) { /* user cancelled */ }
  };

  const handleShareGeneric = async () => {
    if (!stats?.referral_link) return;
    try {
      await Share.share({
        message: `Join ChoosePure – independent lab-tested purity reports for everyday food! Sign up with my link and we both get a free month of Premium: ${stats.referral_link}`,
      });
    } catch (e) { /* user cancelled */ }
  };

  const handleCopyLink = async () => {
    if (!stats?.referral_link) return;
    await Clipboard.setStringAsync(stats.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
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

  const signedUp = stats.total_invited ?? 0;
  const subscribed = stats.completed ?? 0;
  const freeMonths = stats.free_months_earned ?? 0;
  const hasReferrals = signedUp > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Green gradient banner with referral code */}
        <LinearGradient
          colors={['#1A5C42', '#1F6B4E', '#267A59']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Text style={styles.bannerLabel}>YOUR REFERRAL CODE</Text>
          <Text style={styles.bannerCode}>{stats.referral_code || 'CP-XXXXX'}</Text>

          {/* Referral link with copy */}
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>
              {stats.referral_link || ''}
            </Text>
            <Button variant="primary" size="sm" onPress={handleCopyLink}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </View>

          {/* Share buttons */}
          <View style={styles.shareRow}>
            <Button variant="primary" size="md" onPress={handleShareWhatsApp}>
              <View style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
              </View>
            </Button>
            <Button variant="outline" size="md" onPress={handleShareGeneric}>
              <View style={styles.shareBtn}>
                <Icon name="share" size={16} color={theme.colors.primary} />
                <Text style={[styles.shareBtnText, { color: theme.colors.primary }]}>Share Link</Text>
              </View>
            </Button>
          </View>
        </LinearGradient>

        {/* Stats cards - matching website layout */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#1565C0' }]}>{signedUp}</Text>
            <Text style={styles.statLabel}>Signed Up</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{subscribed}</Text>
            <Text style={styles.statLabel}>Subscribed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{freeMonths}</Text>
            <Text style={styles.statLabel}>Free Months</Text>
          </Card>
        </View>

        {/* Empty state or encouragement */}
        {!hasReferrals && (
          <Text style={styles.emptyPrompt}>
            Share your link with friends to start earning free months!
          </Text>
        )}

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

        {/* Copy code button */}
        <Button variant="secondary" size="lg" fullWidth onPress={handleCopyCode}>
          <View style={styles.shareBtn}>
            <Text style={[styles.shareBtnText, { color: theme.colors.primary }]}>
              Copy Referral Code: {stats.referral_code}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}

const HOW_IT_WORKS = [
  ['Share your code', 'Send your referral link to friends via any app.'],
  ['They sign up', 'Friend creates an account using your referral link.'],
  ['They subscribe', 'When your friend subscribes to Premium, you both earn.'],
  ['You both earn', 'You get 1 free month of Premium, and so does your friend.'],
];

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
  bannerLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
    marginBottom: 8,
  },
  bannerCode: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 16,
  },

  /* Link row */
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    marginBottom: 20,
    width: '100%',
  },
  linkText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  /* Share buttons */
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: '#FFFFFF',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  /* Empty state */
  emptyPrompt: {
    textAlign: 'center',
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },

  /* How it works */
  howCard: {
    padding: 16,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
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
});
