import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

function isSubscriber(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'subscribed') return true;
  if (user.subscriptionStatus === 'cancelled' && user.subscriptionExpiry) {
    return new Date(user.subscriptionExpiry) > new Date();
  }
  return false;
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const subscribed = isSubscriber(user);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/api/reports');
      setReports(res.data.reports || res.data || []);
    } catch (e) {
      setError('Failed to load reports. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    fetchReports().finally(() => setLoading(false));
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const handleCardPress = (item, index) => {
    if (subscribed || index === 0) {
      navigation.navigate('ReportDetail', { reportId: item._id });
    } else {
      navigation.navigate('Subscription');
    }
  };

  const showScore = (index) => index === 0 || subscribed;

  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCardPress(item, index)}
      activeOpacity={0.8}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.brandName} numberOfLines={1}>{item.brandName}</Text>
        {showScore(index) ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{item.purityScore ?? '—'}</Text>
            <Text style={styles.scoreLabel}>Purity</Text>
          </View>
        ) : (
          <View style={[styles.scoreBadge, styles.lockedBadge]}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockedLabel}>Subscribe</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>
          {subscribed ? '✅ Active Subscriber' : '🔓 Free Plan — Subscribe to unlock all reports'}
        </Text>
      </View>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>No reports available yet.</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  statusBanner: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  statusText: { color: '#fff', fontFamily: theme.fonts.medium, fontSize: 13 },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardImage: { width: '100%', height: 160, backgroundColor: theme.colors.border },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.regular, fontSize: 13 },
  cardBody: { padding: theme.spacing.md },
  productName: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text },
  brandName: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  scoreBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: { color: '#fff', fontFamily: theme.fonts.bold, fontSize: 18 },
  scoreLabel: { color: '#fff', fontFamily: theme.fonts.regular, fontSize: 12 },
  lockedBadge: { backgroundColor: theme.colors.locked },
  lockIcon: { fontSize: 14 },
  lockedLabel: { color: '#fff', fontFamily: theme.fonts.medium, fontSize: 12 },
  errorText: { color: theme.colors.error, fontFamily: theme.fonts.medium, fontSize: 14, textAlign: 'center' },
  emptyText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.regular, fontSize: 14 },
});
