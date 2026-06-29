import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import apiClient from '../api/client';

// Nutri-Score colour scheme
const NUTRI_SCORE_COLORS = {
  A: '#1F6B4E',
  B: '#85BB65',
  C: '#FFB703',
  D: '#E67E22',
  E: '#D62828',
};

// NOVA Group configuration
const NOVA_CONFIG = {
  1: { label: 'Unprocessed', color: '#1F6B4E' },
  2: { label: 'Culinary Ingredient', color: '#3B82F6' },
  3: { label: 'Processed', color: '#FFB703' },
  4: { label: 'Ultra-processed', color: '#D62828' },
};

// Confidence threshold for amber warnings
const LOW_CONFIDENCE_THRESHOLD = 0.5;

/**
 * LabelResultScreen — Displays extracted label data, scores, and correction flow.
 * Receives scanData via route params from LabelScannerScreen navigation.
 */
export default function LabelResultScreen({ route, navigation }) {
  const [scanData, setScanData] = useState(route.params?.scanData);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [corrections, setCorrections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    scan_id,
    product_name,
    brand,
    nutrition_per_100g,
    serving_info,
    ingredients_raw,
    ingredients_parsed,
    nutri_score,
    nova_group,
    extraction_confidence,
    field_confidences = {},
    warnings = [],
  } = scanData || {};

  // Check if a field has low confidence
  const isLowConfidence = useCallback(
    (fieldName) => {
      const confidence = field_confidences[fieldName];
      return confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD;
    },
    [field_confidences]
  );

  // Start editing a field inline
  function startEditing(fieldName, currentValue) {
    setEditingField(fieldName);
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }

  // Save inline edit to corrections
  function saveFieldEdit() {
    if (editingField) {
      setCorrections((prev) => ({
        ...prev,
        [editingField]: editValue,
      }));
      setEditingField(null);
      setEditValue('');
    }
  }

  // Cancel inline edit
  function cancelFieldEdit() {
    setEditingField(null);
    setEditValue('');
  }

  // Submit corrections via PATCH endpoint
  async function submitCorrections() {
    if (Object.keys(corrections).length === 0 && !correctionMode) {
      setCorrectionMode(true);
      return;
    }

    if (Object.keys(corrections).length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/api/v1/scans/${scan_id}`, {
        corrections,
      });
      // Update displayed data with response
      setScanData(res.data);
      setCorrections({});
      setCorrectionMode(false);
    } catch (e) {
      const errorMessage =
        e.response?.data?.error?.message ||
        e.response?.data?.message ||
        'Failed to submit corrections. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  // Retry after error
  function handleRetry() {
    setError(null);
    submitCorrections();
  }

  // Render Nutri-Score badge
  function renderNutriScoreBadge() {
    if (!nutri_score || nutri_score.grade === null) {
      return (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Not available</Text>
          <Text style={styles.tooltipText}>
            {warnings.find((w) => w.includes('Nutri-Score') || w.includes('Insufficient')) ||
              'Insufficient data for computation'}
          </Text>
        </View>
      );
    }

    const grade = nutri_score.grade;
    const bgColor = NUTRI_SCORE_COLORS[grade] || '#6B6B6B';

    return (
      <View style={[styles.scoreBadgeLarge, { backgroundColor: bgColor }]}>
        <Text style={styles.scoreBadgeLetter}>{grade}</Text>
      </View>
    );
  }

  // Render NOVA Group badge
  function renderNovaGroupBadge() {
    if (!nova_group || nova_group.group === null) {
      return (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Not available</Text>
          <Text style={styles.tooltipText}>
            {warnings.find((w) => w.includes('NOVA') || w.includes('ingredient')) ||
              'No ingredients available for classification'}
          </Text>
        </View>
      );
    }

    const group = nova_group.group;
    const config = NOVA_CONFIG[group] || NOVA_CONFIG[4];

    return (
      <View style={styles.novaRow}>
        <View style={[styles.novaBadge, { backgroundColor: config.color }]}>
          <Text style={styles.novaBadgeText}>{group}</Text>
        </View>
        <View style={styles.novaInfo}>
          <Text style={styles.novaLabel}>{config.label}</Text>
          {nova_group.reason && (
            <Text style={styles.novaReason}>{nova_group.reason}</Text>
          )}
        </View>
      </View>
    );
  }

  // Render a nutrition field row with optional amber warning
  function renderNutritionRow(label, fieldName, value, unit = 'g') {
    const lowConf = isLowConfidence(fieldName);
    const corrected = corrections[fieldName] !== undefined;
    const displayValue =
      corrected ? corrections[fieldName] : value !== null && value !== undefined ? value : '—';

    return (
      <View
        key={fieldName}
        style={[styles.nutritionRow, lowConf && styles.nutritionRowWarning]}
      >
        <View style={styles.nutritionLabelRow}>
          {lowConf && <View style={styles.amberDot} />}
          <Text style={[styles.nutritionLabel, lowConf && styles.nutritionLabelWarning]}>
            {label}
          </Text>
        </View>
        <View style={styles.nutritionValueRow}>
          {editingField === fieldName ? (
            <View style={styles.inlineEditorRow}>
              <TextInput
                style={styles.inlineInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity onPress={saveFieldEdit} style={styles.inlineSaveBtn}>
                <Text style={styles.inlineSaveBtnText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelFieldEdit} style={styles.inlineCancelBtn}>
                <Text style={styles.inlineCancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.nutritionValue, corrected && styles.correctedValue]}>
                {displayValue}
                {displayValue !== '—' ? ` ${unit}` : ''}
              </Text>
              {(lowConf || correctionMode) && (
                <TouchableOpacity
                  onPress={() => startEditing(fieldName, value)}
                  style={styles.editButton}
                  accessibilityLabel={`Edit ${label}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  if (!scanData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorMessage}>No scan data available.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Product Header */}
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product_name || 'Unknown Product'}</Text>
            {brand && <Text style={styles.brandText}>{brand}</Text>}
          </View>
          <View style={styles.headerBadges}>
            {nutri_score && nutri_score.grade && (
              <View
                style={[
                  styles.scoreBadgeSmall,
                  { backgroundColor: NUTRI_SCORE_COLORS[nutri_score.grade] || '#6B6B6B' },
                ]}
              >
                <Text style={styles.scoreBadgeSmallText}>{nutri_score.grade}</Text>
              </View>
            )}
            {nova_group && nova_group.group && (
              <View
                style={[
                  styles.scoreBadgeSmall,
                  { backgroundColor: NOVA_CONFIG[nova_group.group]?.color || '#6B6B6B' },
                ]}
              >
                <Text style={styles.scoreBadgeSmallText}>{nova_group.group}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Nutri-Score Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutri-Score</Text>
          <View style={styles.nutriScoreContent}>
            {renderNutriScoreBadge()}
            {nutri_score && nutri_score.grade && (
              <View style={styles.nutriScoreBreakdown}>
                <Text style={styles.breakdownLabel}>
                  Net Score: {nutri_score.net_score}
                </Text>
                {nutri_score.negative_points !== undefined && (
                  <Text style={styles.breakdownDetail}>
                    Negative: {nutri_score.negative_points} | Positive:{' '}
                    {nutri_score.positive_points}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 3. NOVA Group Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>NOVA Group</Text>
          {renderNovaGroupBadge()}
          {nova_group && nova_group.matched_markers && nova_group.matched_markers.length > 0 && (
            <View style={styles.markersContainer}>
              <Text style={styles.markersLabel}>Matched markers:</Text>
              <View style={styles.markersList}>
                {nova_group.matched_markers.map((marker, idx) => (
                  <View key={idx} style={styles.markerChip}>
                    <Text style={styles.markerChipText}>{marker}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 4. Nutrition Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutrition per 100g</Text>
          {serving_info && (
            <Text style={styles.servingText}>
              Serving: {serving_info.value}
              {serving_info.unit}
              {serving_info.servings_per_container
                ? ` (${serving_info.servings_per_container} servings)`
                : ''}
            </Text>
          )}
          <View style={styles.nutritionTable}>
            {renderNutritionRow('Energy', 'energy_kcal', nutrition_per_100g?.energy_kcal, 'kcal')}
            {renderNutritionRow('Total Fat', 'total_fat_g', nutrition_per_100g?.total_fat_g)}
            {renderNutritionRow('Saturated Fat', 'saturated_fat_g', nutrition_per_100g?.saturated_fat_g)}
            {renderNutritionRow('Trans Fat', 'trans_fat_g', nutrition_per_100g?.trans_fat_g)}
            {renderNutritionRow('Carbohydrates', 'carbohydrates_g', nutrition_per_100g?.carbohydrates_g)}
            {renderNutritionRow('Sugars', 'sugars_g', nutrition_per_100g?.sugars_g)}
            {renderNutritionRow('Added Sugars', 'added_sugars_g', nutrition_per_100g?.added_sugars_g)}
            {renderNutritionRow('Fibre', 'fibre_g', nutrition_per_100g?.fibre_g)}
            {renderNutritionRow('Protein', 'protein_g', nutrition_per_100g?.protein_g)}
            {renderNutritionRow('Sodium', 'sodium_mg', nutrition_per_100g?.sodium_mg, 'mg')}
            {renderNutritionRow('Cholesterol', 'cholesterol_mg', nutrition_per_100g?.cholesterol_mg, 'mg')}
          </View>
        </View>

        {/* 5. Ingredients Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingredients</Text>
          {isLowConfidence('ingredients_raw') && (
            <View style={styles.warningBanner}>
              <View style={styles.amberDot} />
              <Text style={styles.warningBannerText}>Low confidence extraction</Text>
              <TouchableOpacity
                onPress={() => startEditing('ingredients_raw', ingredients_raw)}
                style={styles.editButton}
                accessibilityLabel="Edit ingredients"
                accessibilityRole="button"
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
          {editingField === 'ingredients_raw' ? (
            <View style={styles.ingredientsEditor}>
              <TextInput
                style={styles.ingredientsInput}
                value={editValue}
                onChangeText={setEditValue}
                multiline
                numberOfLines={4}
                autoFocus
              />
              <View style={styles.ingredientsEditorActions}>
                <TouchableOpacity onPress={saveFieldEdit} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelFieldEdit} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.ingredientsText}>
              {corrections.ingredients_raw || ingredients_raw || 'Not available'}
            </Text>
          )}
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. Correct Data Button */}
        <View style={styles.bottomActions}>
          {correctionMode && Object.keys(corrections).length > 0 && (
            <Text style={styles.correctionsSummary}>
              {Object.keys(corrections).length} field(s) edited
            </Text>
          )}
          <TouchableOpacity
            style={[styles.correctButton, submitting && styles.correctButtonDisabled]}
            onPress={submitCorrections}
            disabled={submitting}
            activeOpacity={0.8}
            accessibilityLabel="Correct Data"
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.correctButtonText}>
                {correctionMode && Object.keys(corrections).length > 0
                  ? 'Submit Corrections'
                  : 'Correct Data'}
              </Text>
            )}
          </TouchableOpacity>
          {correctionMode && (
            <TouchableOpacity
              style={styles.cancelCorrectionButton}
              onPress={() => {
                setCorrectionMode(false);
                setCorrections({});
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelCorrectionText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    padding: theme.spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F2419',
  },
  backButton: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
  },
  headerTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Product Header
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.xl,
    color: '#0F2419',
    marginBottom: 4,
  },
  brandText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: '#6B6B6B',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeSmallText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    ...theme.shadow.card,
  },
  cardTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
    color: '#0F2419',
    marginBottom: 12,
  },

  // Nutri-Score
  nutriScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeLetter: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['3xl'],
    color: '#FFFFFF',
  },
  nutriScoreBreakdown: {
    flex: 1,
  },
  breakdownLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
    marginBottom: 2,
  },
  breakdownDetail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: '#6B6B6B',
  },

  // NOVA Group
  novaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  novaBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  novaBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.xl,
    color: '#FFFFFF',
  },
  novaInfo: {
    flex: 1,
  },
  novaLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
  },
  novaReason: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: '#6B6B6B',
    marginTop: 2,
  },
  markersContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  markersLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: '#6B6B6B',
    marginBottom: 6,
  },
  markersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  markerChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markerChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.xs,
    color: '#E67E22',
  },

  // Nutrition Table
  servingText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: '#6B6B6B',
    marginBottom: 10,
  },
  nutritionTable: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nutritionRowWarning: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB703',
    paddingLeft: 8,
    borderRadius: 4,
  },
  nutritionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB703',
    marginRight: 6,
  },
  nutritionLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
  },
  nutritionLabelWarning: {
    color: '#E67E22',
  },
  nutritionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionValue: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
  },
  correctedValue: {
    color: '#1F6B4E',
    fontFamily: theme.fonts.semiBold,
  },
  editButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.xs,
    color: '#E67E22',
  },

  // Inline Editor
  inlineEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#1F6B4E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
    minWidth: 60,
    backgroundColor: '#FFFFFF',
  },
  inlineSaveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1F6B4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSaveBtnText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
  inlineCancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCancelBtnText: {
    color: '#6B6B6B',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },

  // Ingredients
  ingredientsText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
    lineHeight: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  warningBannerText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: '#E67E22',
    flex: 1,
  },
  ingredientsEditor: {
    borderWidth: 1,
    borderColor: '#1F6B4E',
    borderRadius: 8,
    padding: 8,
  },
  ingredientsInput: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: '#0F2419',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ingredientsEditorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#1F6B4E',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: '#6B6B6B',
  },

  // Unavailable badges
  unavailableBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unavailableText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#6B6B6B',
  },
  tooltipText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: '#9B9F97',
    marginTop: 4,
  },

  // Error
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  errorBannerText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#D62828',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorMessage: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.md,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1F6B4E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: '#FFFFFF',
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  correctionsSummary: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: '#1F6B4E',
    marginBottom: 8,
  },
  correctButton: {
    backgroundColor: '#1F6B4E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  correctButtonDisabled: {
    opacity: 0.6,
  },
  correctButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
  },
  cancelCorrectionButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelCorrectionText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: '#6B6B6B',
  },
});
