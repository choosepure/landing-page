import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getCategoryScoreColor } from '../../utils/scoreColors';

/**
 * Category score card with colored score badge, category name, and description.
 */
export default function CategoryScoreCard({ categoryName, score, description }) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.scoreBadge,
          { backgroundColor: getCategoryScoreColor(score) },
        ]}
      >
        <Text style={styles.scoreText}>{score}</Text>
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.green50,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  textColumn: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  categoryName: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
