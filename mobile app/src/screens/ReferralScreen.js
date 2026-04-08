import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../theme';
import apiClient from '../api/client';

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
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (!stats) {
    return <View style={styles.center}><Text style={styles.errorText}>Could not load referral data.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Referral Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeValue}>{stats.referral_code}</Text>
        <Text style={styles.linkText} numberOfLines={1}>{stats.referral_link}</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Invited" value={stats.total_invited ?? 0} />
        <StatCard label="Subscribed" value={stats.completed ?? 0} />
        <StatCard label="Pending" value={stats.pending ?? 0} />
        <StatCard label="Free Months" value={stats.free_months_earned ?? 0} />
      </View>
    </View>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  codeCard: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  codeLabel: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.textSecondary },
  codeValue: { fontFamily: theme.fonts.bold, fontSize: 28, color: theme.colors.primary, marginTop: theme.spacing.xs },
  linkText: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.md },
  shareBtn: {
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  shareBtnText: { color: '#fff', fontFamily: theme.fonts.semiBold, fontSize: 14 },
  copyBtn: {
    borderWidth: 1.5, borderColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  copyBtnText: { color: theme.colors.primary, fontFamily: theme.fonts.semiBold, fontSize: 14 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: theme.spacing.lg,
  },
  statCard: {
    width: '48%', backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.sm,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  statValue: { fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.primary },
  statLabel: { fontFamily: theme.fonts.regular, fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  errorText: { color: theme.colors.error, fontFamily: theme.fonts.medium, fontSize: 14 },
});
