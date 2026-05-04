import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Pantry', 'Dairy', 'Produce', 'Bakery', 'Beverages', 'Snacks'];

const ITEMS = [
  {
    id: '1',
    name: 'Organic Whole Milk',
    brand: 'Happy Valley',
    meta: 'Dairy',
    score: 87,
    imageColors: ['#F4F0E8', '#B8A584'],
  },
  {
    id: '2',
    name: 'Greek Yogurt',
    brand: 'Mountain Fresh',
    meta: 'Dairy',
    score: 92,
    imageColors: ['#FFFDF8', '#E89E92'],
  },
  {
    id: '3',
    name: 'Whole Grain Bread',
    brand: 'Artisan Bakery',
    meta: 'Bakery',
    score: 75,
    imageColors: ['#E5D5BE', '#6B4423'],
  },
  {
    id: '4',
    name: 'Wild Blueberries',
    brand: 'FreshHarvest',
    meta: 'Produce',
    score: 96,
    imageColors: ['#4A5C82', '#2D3E5F'],
  },
];

export default function DiscoverScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const renderCategoryPill = useCallback(
    ({ item }) => {
      const isActive = item === activeCategory;
      return (
        <TouchableOpacity
          style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
          onPress={() => setActiveCategory(item)}
        >
          <Text
            style={[
              styles.pillText,
              isActive ? styles.pillTextActive : styles.pillTextInactive,
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory],
  );

  const renderProduct = useCallback(
    ({ item }) => (
      <ProductCard
        name={item.name}
        brand={item.brand}
        meta={item.meta}
        score={item.score}
        imageColors={item.imageColors}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={ITEMS}
        keyExtractor={keyExtractor}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={
          <>
            {/* Search bar */}
            <Card style={styles.searchCard}>
              <View style={styles.searchRow}>
                <Icon
                  name="search"
                  size={18}
                  color={theme.colors.textDim}
                />
                <TextInput
                  placeholder="Search by product or brand"
                  placeholderTextColor={theme.colors.textDim}
                  style={styles.searchInput}
                />
              </View>
            </Card>

            {/* Category pills */}
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={renderCategoryPill}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}
              style={styles.pillsList}
            />

            {/* Section title */}
            <Text style={styles.sectionTitle}>Top scoring this week</Text>
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
  // Category pills
  pillsList: {
    marginBottom: 16,
  },
  pillsContainer: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
  },
  pillInactive: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: theme.colors.textSecondary,
  },
  // Section title
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    marginBottom: 8,
  },
  // List
  separator: {
    height: 10,
  },
});
