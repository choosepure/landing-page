import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';
import Icon from '../components/Icon';
import NutriGradeBadge from '../components/NutriGradeBadge';

export default function ProductDetailScreen({ route, navigation }) {
  const passedProduct = route?.params?.product || {};
  const [product, setProduct] = useState(passedProduct);
  const [loading, setLoading] = useState(false);

  /* ── Fetch full product details from OFF API if we have a barcode ── */
  useEffect(() => {
    if (passedProduct.barcode) {
      fetchFullProduct(passedProduct.barcode);
    }
  }, [passedProduct.barcode]);

  async function fetchFullProduct(barcode) {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/off/product/${barcode}`);
      if (res.data.found && res.data.product) {
        setProduct({ ...passedProduct, ...res.data.product });
      }
    } catch (e) {
      // Keep the passed product data if fetch fails
    } finally {
      setLoading(false);
    }
  }

  /* ── Derive display values ── */
  const name = product.name || product.productName || 'Unknown Product';
  const brand = product.brand || product.brandName || '';
  const nutriScore = (product.nutriScore || '').toUpperCase();
  const novaGroup = product.novaGroup != null ? String(product.novaGroup) : '—';
  const imageUrl = product.imageUrl || null;
  const ingredients = product.ingredients || '';
  const allergens = product.allergens || '';
  const categories = product.categories || [];
  const nutrition = product.nutritionPer100g || {};

  const hasNutrition = nutrition && Object.keys(nutrition).some(k => nutrition[k] > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero section */}
      <LinearGradient
        colors={['#E8DCC4', '#C9986A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <View style={styles.heroImagePlaceholder} />
        )}
        <Text style={styles.heroName} numberOfLines={2}>{name}</Text>
        <Text style={styles.heroBrand}>{brand}</Text>
      </LinearGradient>

      {/* Loading indicator for full data */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading full details...</Text>
        </View>
      )}

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {nutriScore ? (
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>NUTRI-SCORE</Text>
            <NutriGradeBadge grade={nutriScore} size={40} />
          </Card>
        ) : null}
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>NOVA GROUP</Text>
          <View style={[styles.statBadge, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={styles.statBadgeText}>{novaGroup}</Text>
          </View>
        </Card>
        {product.ecoScore ? (
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>ECO SCORE</Text>
            <View style={[styles.statBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.statBadgeText}>{product.ecoScore.toUpperCase()}</Text>
            </View>
          </Card>
        ) : null}
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>CATEGORIES</Text>
          <Text style={styles.infoBody}>
            {Array.isArray(categories) ? categories.slice(0, 5).join(' · ') : categories}
          </Text>
        </Card>
      )}

      {/* Ingredients */}
      {ingredients ? (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>INGREDIENTS</Text>
          <Text style={styles.infoBody}>{ingredients}</Text>
        </Card>
      ) : null}

      {/* Allergens */}
      {allergens ? (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>ALLERGENS</Text>
          <Text style={styles.infoBody}>{allergens}</Text>
        </Card>
      ) : null}

      {/* Nutrition per 100g */}
      {hasNutrition && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>NUTRITION PER 100G</Text>
          <View style={styles.nutritionGrid}>
            {nutrition.energy_kcal > 0 && <NutritionRow label="Energy" value={`${Math.round(nutrition.energy_kcal)} kcal`} />}
            {nutrition.proteins > 0 && <NutritionRow label="Protein" value={`${nutrition.proteins.toFixed(1)}g`} />}
            {nutrition.fat > 0 && <NutritionRow label="Fat" value={`${nutrition.fat.toFixed(1)}g`} />}
            {nutrition.saturated_fat > 0 && <NutritionRow label="Saturated Fat" value={`${nutrition.saturated_fat.toFixed(1)}g`} />}
            {nutrition.carbohydrates > 0 && <NutritionRow label="Carbs" value={`${nutrition.carbohydrates.toFixed(1)}g`} />}
            {nutrition.sugars > 0 && <NutritionRow label="Sugars" value={`${nutrition.sugars.toFixed(1)}g`} />}
            {nutrition.fiber > 0 && <NutritionRow label="Fiber" value={`${nutrition.fiber.toFixed(1)}g`} />}
            {nutrition.salt > 0 && <NutritionRow label="Salt" value={`${nutrition.salt.toFixed(2)}g`} />}
          </View>
        </Card>
      )}

      {/* Barcode */}
      {product.barcode && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>BARCODE</Text>
          <Text style={styles.barcodeText}>{product.barcode}</Text>
        </Card>
      )}

      {/* Source attribution */}
      <Text style={styles.attribution}>
        Data from Open Food Facts · Community-contributed database
      </Text>
    </ScrollView>
  );
}

function NutritionRow({ label, value }) {
  return (
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: 20, paddingBottom: 32 },
  hero: { borderRadius: theme.borderRadius.xl, padding: 24, alignItems: 'center', marginBottom: 16 },
  heroImage: { width: 132, height: 132, borderRadius: theme.borderRadius.lg, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroImagePlaceholder: { width: 132, height: 132, borderRadius: theme.borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  heroName: { fontFamily: theme.fonts.display, fontSize: theme.fontSize['2xl'], color: '#FFFFFF', textAlign: 'center' },
  heroBrand: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.base, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  loadingText: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statLabel: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize['2xs'], color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  statBadge: { width: 40, height: 40, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  statBadgeText: { fontFamily: theme.fonts.display, fontSize: theme.fontSize.lg, color: '#FFFFFF' },
  infoCard: { padding: 16, marginBottom: 12 },
  infoLabel: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize['2xs'], color: theme.colors.textSecondary, letterSpacing: 4, marginBottom: 6 },
  infoBody: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.base, lineHeight: theme.lineHeight.base, color: theme.colors.text },
  nutritionGrid: { marginTop: 4 },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft },
  nutritionLabel: { fontFamily: theme.fonts.medium, fontSize: theme.fontSize.sm, color: theme.colors.text },
  nutritionValue: { fontFamily: theme.fonts.semiBold, fontSize: theme.fontSize.sm, color: theme.colors.primary },
  barcodeText: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.md, color: theme.colors.text, letterSpacing: 2 },
  attribution: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs, color: theme.colors.textDim, textAlign: 'center', marginTop: 16 },
});
