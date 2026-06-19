import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';

const NUTRISCORE_COLORS = {
  A: '#1E8449',
  B: '#7CB342',
  C: '#F4C430',
  D: '#E89B3C',
  E: '#D14E36',
};

/**
 * Hook to fetch popular products from the API.
 */
export function usePopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/products/popular');
      setProducts(res.data.products || []);
    } catch (e) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

/**
 * Horizontal scrollable section showing popular curated products.
 */
export default function PopularProductsSection({ onProductPress }) {
  const { products, loading, error } = usePopularProducts();

  // Don't render if no products and not loading
  if (!loading && products.length === 0) return null;

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onProductPress?.(item)}
    >
      <Image
        source={{
          uri: item.imageUrl || 'https://via.placeholder.com/120x120/f0f0f0/666?text=No+Image',
        }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.productName}
        </Text>
        {item.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
        {item.nutriscoreGrade ? (
          <View
            style={[
              styles.nutriBadge,
              { backgroundColor: NUTRISCORE_COLORS[item.nutriscoreGrade] || '#9E9E9E' },
            ]}
          >
            <Text style={styles.nutriText}>{item.nutriscoreGrade}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Popular Products</Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ paddingVertical: 20 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 12,
  },
  card: {
    width: 140,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#F0F0F0',
  },
  cardBody: {
    padding: 10,
  },
  productName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 16,
  },
  brand: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  nutriBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  nutriText: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  errorText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
  },
});
