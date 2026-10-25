import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

/**
 * Stats summary row with metric chips for totalParameters, passCount,
 * contextNotes, and safetyConcerns.
 */
export default function StatsRow({ totalParameters, passCount, contextNotes, safetyConcerns }) {
  const metrics = [
    { label: 'Total', value: totalParameters, color: theme.colors.text },
    { label: 'Passed', value: passCount, color: theme.colors.text },
    {
      label: 'Context',
      value: contextNotes,
      color: contextNotes > 0 ? theme.colors.warning : theme.colors.text,
    },
    {
      label: 'Concerns',
      value: safetyConcerns,
      color: safetyConcerns > 0 ? theme.colors.error : theme.colors.text,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.chip}>
            <Text style={[styles.number, { color: metric.color }]}>
              {metric.value}
            </Text>
            <Text style={styles.label}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chip: {
    alignItems: 'center',
    minWidth: 60,
    paddingVertical: theme.spacing.sm,
  },
  number: {
    fontSize: theme.fontSize['2xl'],
    fontFamily: theme.fonts.bold,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
