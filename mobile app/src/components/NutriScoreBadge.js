import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const NUTRI_COLORS = {
  a: '#1F6B4E',
  b: '#85BB65',
  c: '#FFB703',
  d: '#E67E22',
  e: '#D62828',
};

export function getNutriScoreColor(grade) {
  if (!grade) return null;
  const key = String(grade).toLowerCase();
  return NUTRI_COLORS[key] || null;
}

export default function NutriScoreBadge({ grade }) {
  const color = getNutriScoreColor(grade);
  if (!color) return null;

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.letter}>{String(grade).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xs,
  },
  letter: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 20,
  },
});
