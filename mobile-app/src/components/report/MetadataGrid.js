import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const FIELD_LABELS = {
  labName: 'Lab Name',
  labReportNumber: 'Report Number',
  reportDate: 'Report Date',
  batchCode: 'Batch Code',
  sampleCondition: 'Sample Condition',
  totalParametersTested: 'Parameters Tested',
  origin: 'Origin',
  shelfLife: 'Shelf Life',
};

/**
 * Metadata grid displaying report context as a 2-column grid of key-value pairs.
 * Null/empty/undefined fields are omitted.
 */
export default function MetadataGrid({
  labName,
  labReportNumber,
  reportDate,
  batchCode,
  sampleCondition,
  totalParametersTested,
  origin,
  shelfLife,
}) {
  const fields = {
    labName,
    labReportNumber,
    reportDate,
    batchCode,
    sampleCondition,
    totalParametersTested,
    origin,
    shelfLife,
  };

  const entries = Object.entries(fields).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.item}>
            <Text style={styles.label}>{FIELD_LABELS[key]}</Text>
            <Text style={styles.value}>{String(value)}</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '50%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
});
