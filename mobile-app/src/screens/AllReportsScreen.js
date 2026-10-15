import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

function isSubscriber(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'subscribed') return true;
  if (user.subscriptionStatus === 'cancelled' && user.subscriptionExpiry) {
    return new Date(user.subscriptionExpiry) > new Date();
  }
  return false;
}

export default function AllReportsScreen({ navigation }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const subscribed = isSubscriber(user);

  const fetchReports = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/reports');
      setReports(res.data.reports || res.data || []);
    } catch (e) {
      setReports([]);
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

  /* ── Derived data ── */
  const categories = useMemo(() => {
    const cats = new Set(reports.map(r => r.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchesCategory = category === 'All' || r.category === category;
      const matchesQuery = !query ||
        (r.productName || '').toLowerCase().includes(query.toLowerCase()) ||
        (r.brandName || '').toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [reports, category, query]);

  /* ── Handlers ── */
  const handleReportPress = (item, index) => {
    if (subscribed || index === 0) {
      navigation.navigate('ReportDetail', { reportId: item._id });
    } else {
      navigation.navigate('Profile', { screen: 'Subscription' });
    }
  };

  /* ── Render ── */
  const renderCategoryPill = useCallback(({ item }) => {
    const isActive = item === category;
    return (
      <TouchableOpacity
        style={[styles.catPill, isActive ? styles.catPillActive : styles.catPillInactive]}
        onPress={() => setCategory(item)}
      >
        <Text style={[styles.catPillText, isActive ? styles.catPillTextActive : styles.catPillTextInactive]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  }, [category]);

  const renderReport = useCallback(({ item, index }) => (
    <ProductCard
      name={item.productName}
      brand={item.brandName}
      meta={item.category || ''}
      score={item.purityScore}
      imageUrl={item.imageUrl}
      imageColors={!item.imageUrl ? ['#D4E3D8', '#5DA47B'] : null}
      onPress={() => handleReportPress(item, index)}
    />
  ), [subscribed]);

  const keyExtractor = useCallback((item) => item._id, []);

  const renderEmpty = useCallback(() => !loading ? (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No reports found</Text>
      <Text style={styles.emptySubtitle}>
        {query ? 'Try a different search term' : 'No reports in this category yet'}
      </Text>
    </Card>
  ) : null, [loading, query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Search bar */}
            <Card style={styles.searchCard}>
              <View style={styles.searchRow}>
                <Icon name="search" size={18} color={theme.colors.textDim} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search reports by product or brand"
                  placeholderTextColor={theme.colors.textDim}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Icon name="close" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>

            {/* Category pills */}
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={renderCategoryPill}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catPillsContainer}
              style={styles.catPillsList}
            />

            {/* Result count */}
            <Text style={styles.resultCount}>
              {filtered.length} report{filtered.length !== 1 ? 's' : ''}
              {category !== 'All' ? ` in ${category}` : ''}
            </Text>

            {!subscribed && (
              <Card style={styles.subscribeHint}>
                <Icon name="lock" size={16} color={theme.colors.primary} />
                <Text style={styles.subscribeHintText}>
                  Subscribe to access all reports. First report is free.
                </Text>
              </Card>
            )}
          </>
        }
      />
    </View>
  );
}

function ItemSeparator() { return <View style={styles.separator} />; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 32 },
  searchCard: { paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontFamily: theme.fonts.regular, fontSize: theme.fontSize.base, color: theme.colors.text, padding: 0 },
  catPillsList: { marginBottom: 12 },
  catPillsContainer: { gap: 8, paddingRight: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999 },
  catPillActive: { backgroundColor: theme.colors.primary },
  catPillInactive: { backgroundColor: theme.colors.cardBackground, borderWidth: 1, borderColor: theme.colors.border },
  catPillText: { fontFamily: theme.fonts.semiBold, fontSize: theme.fontSize.sm },
  catPillTextActive: { color: '#FFFFFF' },
  catPillTextInactive: { color: theme.colors.textSecondary },
  resultCount: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: 12 },
  subscribeHint: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 12 },
  subscribeHintText: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, flex: 1 },
  separator: { height: 10 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize.base, color: theme.colors.text, marginBottom: 4 },
  emptySubtitle: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center' },
});
