import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getScoreColor } from '../../utils/scoreColors';

/**
 * Product comparison table with header row, data rows, and highlighted current product.
 */
export default function ComparisonTable({ comparisons, currentProductName }) {
  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.productCol]}>Product</Text>
        <Text style={[styles.headerCell, styles.scoreCol]}>Score</Text>
        <Text style={[styles.headerCell, styles.ratingCol]}>Rating</Text>
      </View>

      {/* Data rows */}
      {comparisons.map((item, index) => {
        const isCurrentProduct = item.productName === currentProductName;
        return (
          <View
            key={index}
            style={[
              styles.dataRow,
              isCurrentProduct && styles.highlightedRow,
            ]}
          >
            <Text
              style={[styles.dataCell, styles.productCol]}
              numberOfLines={1}
            >
              {item.productName}
            </Text>
            <Text style={[styles.scoreValue, styles.scoreCol]}>
              {item.score}
            </Text>
            <View style={styles.ratingCol}>
              <View
                style={[
                  styles.ratingBadge,
                  { backgroundColor: getScoreColor(item.score) },
                ]}
              >
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  highlightedRow: {
    backgroundColor: theme.colors.green50,
  },
  dataCell: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  productCol: {
    flex: 2,
  },
  scoreCol: {
    flex: 1,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  ratingCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ratingBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
  },
});
