import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { getSeverityColor } from '../../utils/scoreColors';

/**
 * Recommendation card with severity-tagged pill, bold title, and description.
 */
export default function RecommendationCard({ severity, title, description }) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.severityTag,
          { backgroundColor: getSeverityColor(severity) },
        ]}
      >
        <Text style={styles.severityText}>{severity}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
  },
  severityTag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  severityText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  title: {
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
