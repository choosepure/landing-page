import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import Card from '../components/Card';

const NUTRI_SCORE_IMAGES = {
  A: 'https://choosepure.in/public/A.png',
  B: 'https://choosepure.in/public/B.png',
  C: 'https://choosepure.in/public/C.png',
  D: 'https://choosepure.in/public/D.png',
  E: 'https://choosepure.in/public/E.png',
};

const NOVA_COLORS = {
  '1': '#1E8449',
  '2': '#F4C430',
  '3': '#E89B3C',
  '4': '#D14E36',
};

const ECO_COLORS = {
  A: '#1E8449',
  B: '#7CB342',
  C: '#F4C430',
  D: '#E89B3C',
  E: '#D14E36',
};

export default function ProductDetailScreen({ route }) {
  const passedProduct = route?.params?.product || {};
  const [product, setProduct] = useState(passedProduct);
  const [loading, setLoading] = useState(false);

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
      // Keep the passed product data
    } finally {
      setLoading(false);
    }
  }

  const name = product.name || product.productName || 'Unknown Product';
  const brand = product.brand || product.brandName || '';
  const nutriScore = (product.nutriScore || '').toUpperCase();
  const novaGroup = product.novaGroup != null ? String(product.novaGroup) : null;
  const ecoScore = product.ecoScore ? product.ecoScore.toUpperCase() : null;
  const imageUrl = product.imageUrl || null;
  const categories = product.categories || [];
  const ingredients = product.ingredients || '';
  const allergens = product.allergens || '';
  const nutrition = product.nutritionPer100g || {};
  const hasNutrition = nutrition && Object.keys(nutrition).some(k => nutrition[k] > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>

      {/* Product name */}
      <Text style={styles.productName}>{name}</Text>
      {brand ? <Text style={styles.productBrand}>{brand}</Text> : null}

      {/* Nutri-Score image */}
      {nutriScore && NUTRI_SCORE_IMAGES[nutriScore] ? (
        <View style={styles.nutriScoreSection}>
          <Text style={styles.nutriScoreLabel}>NUTRI-SCORE</Text>
          <Image
            source={{ uri: NUTRI_SCORE_IMAGES[nutriScore] }}
            style={styles.nutriScoreImage}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      )}

      {/* NOVA Group & ECO Score */}
      {(novaGroup || ecoScore) && (
        <View style={styles.badgeRow}>
          {novaGroup && (
            <Card style={styles.badgeCard}>
              <Text style={styles.badgeLabel}>NOVA GROUP</Text>
              <View style={[styles.circleBadge, { borderColor: NOVA_COLORS[novaGroup] || theme.colors.primary }]}>
                <Text style={[styles.circleBadgeText, { color: NOVA_COLORS[novaGroup] || theme.colors.primary }]}>
                  {novaGroup}
                </Text>
              </View>
            </Card>
          )}
          {ecoScore && (
            <Card style={styles.badgeCard}>
              <Text style={styles.badgeLabel}>ECO Score</Text>
              <View style={[styles.circleBadge, { borderColor: ECO_COLORS[ecoScore] || theme.colors.primary }]}>
                <Text style={[styles.circleBadgeText, { color: ECO_COLORS[ecoScore] || theme.colors.primary }]}>
                  {ecoScore}
                </Text>
              </View>
            </Card>
          )}
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>CATEGORIES</Text>
          <Text style={styles.infoBody}>
            {Array.isArray(categories) ? categories.slice(0, 5).join(', ') : categories}
          </Text>
        </Card>
      )}

      {/* Nutrition per 100g */}
      {hasNutrition && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>NUTRITION PER 100G</Text>
          <View style={styles.nutritionGrid}>
            {nutrition.energy_kcal > 0 && <NutritionRow label="Energy" value={`${Math.round(nutrition.energy_kcal)} kcal`} />}
            {nutrition.carbohydrates > 0 && <NutritionRow label="Carbs" value={`${nutrition.carbohydrates.toFixed(1)}g`} />}
            {nutrition.sugars > 0 && <NutritionRow label="Sugars" value={`${nutrition.sugars.toFixed(1)}g`} />}
            {nutrition.proteins > 0 && <NutritionRow label="Protein" value={`${nutrition.proteins.toFixed(1)}g`} />}
            {nutrition.fat > 0 && <NutritionRow label="Fat" value={`${nutrition.fat.toFixed(1)}g`} />}
            {nutrition.saturated_fat > 0 && <NutritionRow label="Saturated Fat" value={`${nutrition.saturated_fat.toFixed(1)}g`} />}
            {nutrition.fiber > 0 && <NutritionRow label="Fiber" value={`${nutrition.fiber.toFixed(1)}g`} />}
            {nutrition.salt > 0 && <NutritionRow label="Salt" value={`${nutrition.salt.toFixed(2)}g`} />}
          </View>
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

      {/* Barcode */}
      {product.barcode && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>BARCODE</Text>
          <Text style={styles.barcodeText}>{product.barcode}</Text>
        </Card>
      )}

      {/* Attribution */}
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
  content: { padding: 20, paddingBottom: 40 },

  /* Product image */
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 160,
    height: 160,
    borderRadius: theme.borderRadius.lg,
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.green50,
  },

  /* Product name */
  productName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  productBrand: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  /* Nutri-Score */
  nutriScoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nutriScoreLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nutriScoreImage: {
    width: 200,
    height: 50,
  },

  /* Loading */
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  /* NOVA & ECO badges */
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  badgeCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  badgeLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: 10,
  },
  circleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
  },

  /* Info cards */
  infoCard: { padding: 16, marginBottom: 12 },
  infoLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  infoBody: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
    color: theme.colors.text,
  },

  /* Nutrition */
  nutritionGrid: { marginTop: 4 },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  nutritionLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  nutritionValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },

  /* Barcode */
  barcodeText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    letterSpacing: 2,
  },

  /* Attribution */
  attribution: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 16,
  },
});
