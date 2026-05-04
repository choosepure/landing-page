import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import NutriGradeBadge from '../components/NutriGradeBadge';

const NUTRI_GRADES = [
  { grade: 'A', label: 'Excellent' },
  { grade: 'B', label: 'Good' },
  { grade: 'C', label: 'Fair' },
  { grade: 'D', label: 'Poor' },
  { grade: 'E', label: 'Avoid' },
];

export default function NutriGradeListScreen({ route, navigation }) {
  const initialGrade = route?.params?.grade || 'A';
  const [grade, setGrade] = useState(initialGrade);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gradeCounts, setGradeCounts] = useState({});

  /* ── Fetch products from OFF API (India only) ──────────── */

  const fetchProducts = useCallback(async (g, q) => {
    setLoading(true);
    try {
      const params = `grade=${g}&page_size=20${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      const res = await apiClient.get(`/api/off/nutriscore?${params}`);
      setProducts(res.data.products || []);
      setTotalCount(res.data.totalCount || 0);
      setGradeCounts((prev) => ({
        ...prev,
        [g]: res.data.totalCount || 0,
      }));
    } catch (e) {
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(grade, query);
  }, [grade, fetchProducts]);

  /* ── Search with debounce ──────────────────────────────── */

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      fetchProducts(grade, query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, grade, fetchProducts]);

  const handleGradeChange = useCallback((newGrade) => {
    setGrade(newGrade);
    setQuery('');
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    fetchProducts(grade, '');
  }, [grade, fetchProducts]);

  /* ── Render helpers ────────────────────────────────────── */

  const renderGradePill = useCallback(
    (g) => {
      const isSelected = g.grade === grade;
      const count = gradeCounts[g.grade];
      return (
        <TouchableOpacity
          key={g.grade}
          style={[
            styles.gradePill,
            isSelected ? styles.gradePillSelected : styles.gradePillInactive,
          ]}
          onPress={() => handleGradeChange(g.grade)}
        >
          <NutriGradeBadge grade={g.grade} size={36} />
          <Text style={styles.gradeCount}>
            {count != null ? count : '—'}
          </Text>
        </TouchableOpacity>
      );
    },
    [grade, gradeCounts, handleGradeChange],
  );

  const renderProduct = useCallback(
    ({ item, index }) => (
      <ProductCard
        name={item.name || 'Unknown Product'}
        brand={item.brand || ''}
        meta={item.nutriScore ? `Nutri-Score ${item.nutriScore.toUpperCase()}` : ''}
        grade={grade}
        imageColors={item.imageUrl ? null : ['#E8DCC4', '#B89A6F']}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      />
    ),
    [grade, navigation],
  );

  const keyExtractor = useCallback(
    (item, index) => item.barcode || `${grade}-${index}`,
    [grade],
  );

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySubtitle}>
            {query
              ? 'Try a different search term'
              : 'No Indian products found for this grade'}
          </Text>
        </Card>
      ) : null,
    [loading, query],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          <>
            {/* Grade pills */}
            <View style={styles.gradeRow}>
              {NUTRI_GRADES.map(renderGradePill)}
            </View>

            {/* Search bar */}
            <Card style={styles.searchCard}>
              <View style={styles.searchRow}>
                <Icon name="search" size={18} color={theme.colors.textDim} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search Indian products by name or brand"
                  placeholderTextColor={theme.colors.textDim}
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={handleClearQuery}>
                    <Icon name="close" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>

            {/* Result count */}
            <Text style={styles.resultCount}>
              {loading
                ? 'Loading...'
                : `${products.length} of ${totalCount} Indian products in Grade ${grade}`}
            </Text>

            {/* Loading indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  // Grade pills
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  gradePill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    borderWidth: 1,
  },
  gradePillSelected: {
    backgroundColor: theme.colors.cardBackground,
    borderColor: theme.colors.primaryLight,
    ...theme.shadow.elev,
  },
  gradePillInactive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: theme.colors.border,
    opacity: 0.7,
  },
  gradeCount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.text,
  },
  // Search
  searchCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
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
  // Result count
  resultCount: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  // Loading
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // List
  separator: {
    height: 10,
  },
  // Empty state
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
