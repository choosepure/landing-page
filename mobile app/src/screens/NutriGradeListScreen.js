import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Dropdown from '../components/Dropdown';

const GRADE_OPTIONS = [
  { value: 'all', label: 'All Scores', meta: 'All Indian products' },
  { value: 'A', label: 'Grade A · Excellent', meta: '' },
  { value: 'B', label: 'Grade B · Good', meta: '' },
  { value: 'C', label: 'Grade C · Fair', meta: '' },
  { value: 'D', label: 'Grade D · Poor', meta: '' },
  { value: 'E', label: 'Grade E · Avoid', meta: '' },
];

const CATEGORIES = [
  'All', 'Snacks', 'Dairy', 'Beverages', 'Cereals', 'Biscuits',
  'Chocolates', 'Noodles', 'Sauces', 'Oils', 'Spices', 'Sweets',
  'Baby foods', 'Breads', 'Juices', 'Tea', 'Coffee',
];

export default function NutriGradeListScreen({ route, navigation }) {
  const initialGrade = route?.params?.grade || 'all';
  const [grade, setGrade] = useState(initialGrade);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimer = useRef(null);

  /* ── Fetch products ────────────────────────────────────── */

  const fetchProducts = useCallback(async (g, q, cat, pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let params = `grade=${g}&page=${pg}&page_size=20`;
      if (q) params += `&q=${encodeURIComponent(q)}`;
      if (cat && cat !== 'All') params += `&category=${encodeURIComponent(cat)}`;

      const res = await apiClient.get(`/api/off/nutriscore?${params}`);
      const newProducts = res.data.products || [];
      const total = res.data.totalCount || 0;

      if (append) {
        setProducts((prev) => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      setTotalCount(total);
      setHasMore(pg * 20 < total);
    } catch (e) {
      if (!append) { setProducts([]); setTotalCount(0); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  /* ── Triggers ──────────────────────────────────────────── */

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(grade, query, category, 1, false);
  }, [grade, category, fetchProducts]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchProducts(grade, query, category, 1, false);
    }, 600);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  /* ── Load more ─────────────────────────────────────────── */

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(grade, query, category, nextPage, true);
  }, [hasMore, loadingMore, loading, page, grade, query, category, fetchProducts]);

  /* ── Render helpers ────────────────────────────────────── */

  const renderCategoryPill = useCallback(({ item }) => {
    const isActive = item === category;
    return (
      <TouchableOpacity
        style={[styles.catPill, isActive ? styles.catPillActive : styles.catPillInactive]}
        onPress={() => { setCategory(item); setPage(1); }}
      >
        <Text style={[styles.catPillText, isActive ? styles.catPillTextActive : styles.catPillTextInactive]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  }, [category]);

  const renderProduct = useCallback(({ item }) => (
    <ProductCard
      name={item.name || 'Unknown Product'}
      brand={item.brand || ''}
      meta={item.categories && item.categories.length > 0 ? item.categories[0] : ''}
      grade={item.nutriScore ? item.nutriScore.toUpperCase() : null}
      imageUrl={item.imageUrl}
      imageColors={!item.imageUrl ? ['#E8DCC4', '#B89A6F'] : null}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    />
  ), [navigation]);

  const keyExtractor = useCallback((item, index) => item.barcode || `${grade}-${index}`, [grade]);

  const renderFooter = useCallback(() => {
    if (loadingMore) return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
    if (!hasMore && products.length > 0) return (
      <View style={styles.footerLoading}>
        <Text style={styles.footerText}>All products loaded</Text>
      </View>
    );
    return null;
  }, [loadingMore, hasMore, products.length]);

  const renderEmpty = useCallback(() => !loading ? (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        {query ? 'Try a different search term' : 'Try changing the filters'}
      </Text>
    </Card>
  ) : null, [loading, query]);

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* Nutri-Score Dropdown */}
            <View style={styles.dropdownContainer}>
              <Dropdown
                label="Nutri-Score"
                value={grade}
                options={GRADE_OPTIONS}
                onChange={(val) => { setGrade(val); setPage(1); }}
                renderLeft={(opt) =>
                  opt.value !== 'all' ? <NutriGradeBadge grade={opt.value} size={32} /> : null
                }
                renderOption={(opt) =>
                  opt.value !== 'all' ? <NutriGradeBadge grade={opt.value} size={28} /> : null
                }
              />
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
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={renderCategoryPill}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catPillsContainer}
              style={styles.catPillsList}
            />

            {/* Result count */}
            <View style={styles.resultRow}>
              <Text style={styles.resultCount}>
                {loading ? 'Searching...' : `${products.length} of ${totalCount.toLocaleString()} products`}
              </Text>
              {category !== 'All' && (
                <TouchableOpacity style={styles.filterChip} onPress={() => setCategory('All')}>
                  <Text style={styles.filterChipText}>{category}</Text>
                  <Icon name="close" size={12} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

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

function ItemSeparator() { return <View style={styles.separator} />; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: 20, paddingBottom: 32 },
  dropdownContainer: { marginBottom: 12 },
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
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultCount: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.green50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  filterChipText: { fontFamily: theme.fonts.medium, fontSize: theme.fontSize.xs, color: theme.colors.primary },
  loadingContainer: { paddingVertical: 20, alignItems: 'center' },
  footerLoading: { paddingVertical: 16, alignItems: 'center', gap: 4 },
  footerText: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  separator: { height: 10 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize.base, color: theme.colors.text, marginBottom: 4 },
  emptySubtitle: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center' },
});
