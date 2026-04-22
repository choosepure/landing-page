import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const NUTRITION_ROWS = [
  { key: 'energy_kcal', label: 'Energy', unit: 'kcal' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated fat', unit: 'g' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
  { key: 'sugars', label: 'Sugars', unit: 'g' },
  { key: 'proteins', label: 'Proteins', unit: 'g' },
  { key: 'salt', label: 'Salt', unit: 'g' },
  { key: 'fiber', label: 'Fibre', unit: 'g' },
];

function formatValue(value, unit) {
  if (value === null || value === undefined) return '—';
  return `${value} ${unit}`;
}

export default function NutritionTable({ nutritionPer100g }) {
  if (!nutritionPer100g) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nutrition Facts (per 100g)</Text>
      {NUTRITION_ROWS.map((row, index) => (
        <View
          key={row.key}
          style={[styles.row, index % 2 === 0 && styles.rowEven]}
        >
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>
            {formatValue(nutritionPer100g[row.key], row.unit)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  rowEven: {
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
  },
  label: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  value: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
