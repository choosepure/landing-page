import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import Dropdown from '../components/Dropdown';
import NutriGradeBadge from '../components/NutriGradeBadge';

/* ── Nutri-grade constants ─────────────────────────────────── */

const NUTRI_GRADES = [
  { grade: 'A', label: 'Excellent' },
  { grade: 'B', label: 'Good' },
  { grade: 'C', label: 'Fair' },
  { grade: 'D', label: 'Poor' },
  { grade: 'E', label: 'Avoid' },
];

/* ── Helpers ────────────────────────────────────────────────── */

function isSubscriber(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'subscribed') return true;
  if (user.subscriptionStatus === 'cancelled' && user.subscriptionExpiry) {
    return new Date(user.subscriptionExpiry) > new Date();
  }
  return false;
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

/* ── Image color palette for report cards ──────────────────── */

const REPORT_IMAGE_COLORS = [
  ['#F4F0E8', '#B8A584'],
  ['#FFFDF8', '#E89E92'],
  ['#E5D5BE', '#6B4423'],
  ['#D4E3D8', '#5DA47B'],
  ['#F4D03F', '#D4A82A'],
];

/* ── Component ─────────────────────────────────────────────── */

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [nutriProducts, setNutriProducts] = useState([]);
  const [nutriLoading, setNutriLoading] = useState(false);
  const [nutriCounts, setNutriCounts] = useState({});
  const [nutriPage, setNutriPage] = useState(1);
  const [nutriHasMore, setNutriHasMore] = useState(true);
  const [nutriLoadingMore, setNutriLoadingMore] = useState(false);

  const subscribed = isSubscriber(user);

  /* ── Data fetching ─────────────────────────────────────── */

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

  /* ── Nutri-score data fetching ─────────────────────────── */

  const fetchNutriProducts = useCallback(async (grade, page = 1) => {
    if (page === 1) {
      setNutriLoading(true);
    } else {
      setNutriLoadingMore(true);
    }
    try {
      const res = await apiClient.get(`/api/off/nutriscore?grade=${grade}&page=${page}&page_size=10`);
      const newProducts = res.data.products || [];
      const totalCount = res.data.totalCount || 0;

      if (page === 1) {
        setNutriProducts(newProducts);
      } else {
        setNutriProducts((prev) => [...prev, ...newProducts]);
      }

      setNutriCounts((prev) => ({
        ...prev,
        [grade]: totalCount,
      }));
      setNutriHasMore(page * 10 < totalCount);
    } catch (e) {
      if (page === 1) setNutriProducts([]);
    } finally {
      setNutriLoading(false);
      setNutriLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setNutriPage(1);
    setNutriHasMore(true);
    fetchNutriProducts(selectedGrade, 1);
  }, [selectedGrade, fetchNutriProducts]);

  const loadMoreNutriProducts = useCallback(() => {
    if (!nutriHasMore || nutriLoadingMore || nutriLoading) return;
    const nextPage = nutriPage + 1;
    setNutriPage(nextPage);
    fetchNutriProducts(selectedGrade, nextPage);
  }, [nutriHasMore, nutriLoadingMore, nutriLoading, nutriPage, selectedGrade, fetchNutriProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  /* ── Navigation handlers ───────────────────────────────── */

  const handleCardPress = (item, index) => {
    if (subscribed || index === 0) {
      navigation.navigate('ReportDetail', { reportId: item._id });
    } else {
      navigation.navigate('Subscription');
    }
  };

  /* ── Derived data ──────────────────────────────────────── */

  const dropdownOptions = useMemo(
    () =>
      NUTRI_GRADES.map((g) => ({
        value: g.grade,
        label: `Grade ${g.grade} · ${g.label}`,
        meta: nutriCounts[g.grade] != null ? `${nutriCounts[g.grade]} products` : '',
      })),
    [nutriCounts],
  );

  const displayName = user?.name || user?.displayName || 'there';

  /* ── Loading state ─────────────────────────────────────── */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /* ── Render helpers ────────────────────────────────────── */

  const renderReportItem = ({ item, index }) => (
    <ProductCard
      name={item.productName}
      brand={item.brandName}
      meta={getTimeAgo(item.createdAt)}
      score={item.purityScore}
      imageUrl={item.imageUrl}
      imageColors={!item.imageUrl ? REPORT_IMAGE_COLORS[index % REPORT_IMAGE_COLORS.length] : null}
      onPress={() => handleCardPress(item, index)}
    />
  );

  const renderNutriItem = ({ item }) => (
    <ProductCard
      name={item.name || 'Unknown Product'}
      brand={item.brand || ''}
      meta={item.nutriScore ? `Nutri-Score ${item.nutriScore.toUpperCase()}` : ''}
      grade={selectedGrade}
      imageUrl={item.imageUrl}
      imageColors={!item.imageUrl ? ['#E8DCC4', '#B89A6F'] : null}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    />
  );

  const reportKeyExtractor = (item) => item._id;
  const nutriKeyExtractor = (item, index) => item.barcode || `${selectedGrade}-${index}`;

  /* ── Main render ───────────────────────────────────────── */

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>ChoosePure</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {displayName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go to profile"
          >
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ──────────────────────────────────── */}
        <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Icon name="search" size={18} color={theme.colors.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, brands, categories..."
              placeholderTextColor={theme.colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('ScannerHome')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Scan barcode"
            >
              <Icon name="scan-corners" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Error banner ────────────────────────────────── */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Latest Testing Reports ──────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Testing Reports</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AllReports')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {reports.length > 0 ? (
          <FlatList
            data={reports}
            keyExtractor={reportKeyExtractor}
            renderItem={renderReportItem}
            scrollEnabled={false}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={null}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports available yet.</Text>
          </View>
        )}

        {/* ── Check Nutri-score ───────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Check Nutri-score</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('NutriGradeList', { grade: selectedGrade })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dropdownContainer}>
          <Dropdown
            label="Filter by grade"
            value={selectedGrade}
            options={dropdownOptions}
            onChange={setSelectedGrade}
            renderLeft={(option) => (
              <NutriGradeBadge grade={option.value} size={36} />
            )}
            renderOption={(option) => (
              <NutriGradeBadge grade={option.value} size={32} />
            )}
          />
        </View>

        {nutriLoading ? (
          <View style={styles.nutriLoadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={nutriProducts}
            keyExtractor={nutriKeyExtractor}
            renderItem={renderNutriItem}
            scrollEnabled={false}
            contentContainerStyle={styles.productList}
            ListFooterComponent={
              nutriLoadingMore ? (
                <View style={styles.nutriLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : nutriHasMore && nutriProducts.length > 0 ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreNutriProducts}>
                  <Text style={styles.loadMoreText}>Load more products</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary,
    marginBottom: 2,
  },
  greeting: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
  },

  /* Search */
  searchCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    padding: 0,
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
  },
  viewAllText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },

  /* Product lists */
  productList: {
    gap: 10,
    marginBottom: 28,
  },

  /* Dropdown */
  dropdownContainer: {
    marginBottom: 16,
  },

  /* Nutri loading */
  nutriLoadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 28,
  },

  /* Load more */
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },

  /* Error */
  errorContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
  },

  /* Empty */
  emptyContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: 28,
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
});
