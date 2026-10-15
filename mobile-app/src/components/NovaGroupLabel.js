import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const NOVA_LABELS = {
  1: 'Unprocessed or minimally processed',
  2: 'Processed culinary ingredients',
  3: 'Processed foods',
  4: 'Ultra-processed food and drink products',
};

export function getNovaLabel(group) {
  if (group === null || group === undefined) return null;
  return NOVA_LABELS[group] || null;
}

export default function NovaGroupLabel({ group }) {
  const label = getNovaLabel(group);
  if (!label) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.groupNumber}>NOVA {group}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  groupNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  label: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
});
