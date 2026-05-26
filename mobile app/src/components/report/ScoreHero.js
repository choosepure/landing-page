import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getScoreColor } from '../../utils/scoreColors';

/**
 * Score hero section displaying product name, brand, purity score circle, and verdict.
 */
export default function ScoreHero({ productName, brandName, purityScore, scoreVerdict }) {
  return (
    <View style={styles.container}>
      <Text style={styles.productName}>{productName}</Text>
      <Text style={styles.brandName}>{brandName}</Text>

      <View
        style={[
          styles.scoreCircle,
          { backgroundColor: getScoreColor(purityScore) },
        ]}
      >
        <Text style={styles.scoreNumber}>{purityScore}</Text>
        <Text style={styles.scoreLabel}>/100</Text>
      </View>

      <Text style={styles.verdict}>{scoreVerdict}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  productName: {
    fontSize: theme.fontSize['2xl'],
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  brandName: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  scoreNumber: {
    fontSize: theme.fontSize['4xl'],
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  verdict: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
