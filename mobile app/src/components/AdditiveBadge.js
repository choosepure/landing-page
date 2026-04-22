import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const ADDITIVE_COLORS = {
  low: { bg: '#E8F5E9', text: '#2E7D32' },
  moderate: { bg: '#FFF8E1', text: '#E65100' },
  high: { bg: '#FFEBEE', text: '#C62828' },
  unknown: { bg: '#F5F5F5', text: '#6B6B6B' },
};

export function getAdditiveColors(risk) {
  return ADDITIVE_COLORS[risk] || ADDITIVE_COLORS.unknown;
}

export default function AdditiveBadge({ code, name, risk }) {
  const colors = getAdditiveColors(risk);

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  code: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
  },
  name: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
  },
});
