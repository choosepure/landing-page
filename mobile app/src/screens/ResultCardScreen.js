import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';
import { saveScanRecord } from '../utils/scanHistory';
import NutriScoreBadge from '../components/NutriScoreBadge';
import NovaGroupLabel from '../components/NovaGroupLabel';
import AdditiveBadge from '../components/AdditiveBadge';
import NutritionTable from '../components/NutritionTable';

export default function ResultCardScreen({ route, navigation }) {
  const { barcode } = route.params;
  const [product, setProduct] = useState(route.params.product || null);
  const [matchedReport, setMatchedReport] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(!route.params.product);
  const [loadingReport, setLoadingReport] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let currentProduct = route.params.product;

      // If product is null (navigated from scan history), re-fetch from OFF proxy
      if (!currentProduct) {
        setLoadingProduct(true);
        try {
          const res = await apiClient.get(`/api/off/product/${barcode}`);
          if (res.data.found && !cancelled) {
            currentProduct = res.data.product;
            setProduct(currentProduct);
          }
        } catch {
          // Silently fail — screen will show empty state
        } finally {
          if (!cancelled) setLoadingProduct(false);
        }
      }

      // Save scan record
      if (currentProduct) {
        saveScanRecord(barcode, currentProduct);
      }

      // Cross-reference with ChoosePure reports
      await crossReferenceReport(barcode, cancelled);
    }

    async function crossReferenceReport(bc, isCancelled) {
      setLoadingReport(true);
      try {
        const res = await apiClient.get('/api/reports');
        const reports = res.data.reports || res.data || [];
        const match = reports.find(r => r.barcode === bc);
        if (match && !isCancelled) setMatchedReport(match);
      } catch {
        // Silently fail — OFF data still shows
      } finally {
        if (!isCancelled) setLoadingReport(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [barcode]);

  // Show loading while re-fetching product from history
  if (loadingProduct) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

  // Product not found after re-fetch
  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Product data not available.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ChoosePure Lab Report section */}
      {loadingReport ? (
        <View style={styles.reportLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.reportLoadingText}>Checking ChoosePure reports...</Text>
        </View>
      ) : matchedReport ? (
        <View style={styles.labReportCard}>
          <Text style={styles.labReportTitle}>ChoosePure Lab Report</Text>
          <Text style={styles.labReportProduct}>{matchedReport.productName}</Text>
          {matchedReport.purityScore != null && (
            <View style={styles.purityBadge}>
              <Text style={styles.purityScore}>{matchedReport.purityScore}</Text>
              <Text style={styles.purityLabel}>Purity Score</Text>
            </View>
          )}
          {matchedReport.statusBadges && matchedReport.statusBadges.length > 0 && (
            <View style={styles.badgesRow}>
              {matchedReport.statusBadges.map((badge, i) => (
                <View key={i} style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.viewReportButton}
            onPress={() => navigation.navigate('ScanReportDetail', { reportId: matchedReport._id })}
            activeOpacity={0.8}
          >
            <Text style={styles.viewReportButtonText}>View Full Report</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Product header */}
      <View style={styles.card}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand ? (
            <Text style={styles.brandName}>{product.brand}</Text>
          ) : null}
        </View>
      </View>

      {/* Nutri-Score */}
      {product.nutriScore ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nutri-Score</Text>
          <NutriScoreBadge grade={product.nutriScore} />
        </View>
      ) : null}

      {/* NOVA Group */}
      {product.novaGroup ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>NOVA Group</Text>
          <NovaGroupLabel group={product.novaGroup} />
        </View>
      ) : null}

      {/* Ingredients */}
      {product.ingredients ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.bodyText}>{product.ingredients}</Text>
        </View>
      ) : null}

      {/* Additives */}
      {product.additives && product.additives.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additives</Text>
          <View style={styles.additivesContainer}>
            {product.additives.map((a, index) => (
              <AdditiveBadge
                key={`${a.code || a.eNumber}-${index}`}
                code={a.eNumber || a.code}
                name={a.name}
                risk={a.risk}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Allergens */}
      {product.allergens ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <Text style={styles.bodyText}>{product.allergens}</Text>
        </View>
      ) : null}

      {/* Nutrition Table */}
      {product.nutritionPer100g ? (
        <NutritionTable nutritionPer100g={product.nutritionPer100g} />
      ) : null}

      {/* Attribution */}
      <Text style={styles.attribution}>
        Data from Open Food Facts (openfoodfacts.org) under ODbL licence
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  /* Report loading */
  reportLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  reportLoadingText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  /* ChoosePure Lab Report card */
  labReportCard: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  labReportTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  labReportProduct: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  purityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  purityScore: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.primary,
  },
  purityLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.primary,
  },
  viewReportButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  viewReportButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },

  /* Generic card */
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  /* Product header */
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
  },
  productInfo: {
    paddingBottom: theme.spacing.xs,
  },
  productName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    color: theme.colors.text,
  },
  brandName: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Section titles */
  sectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  bodyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },

  /* Additives */
  additivesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /* Attribution */
  attribution: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
