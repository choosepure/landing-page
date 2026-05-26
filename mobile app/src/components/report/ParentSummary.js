import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

/**
 * "What Parents Should Know" section with green gradient background and white text.
 */
export default function ParentSummary({ summary }) {
  return (
    <LinearGradient
      colors={['#226342', '#185A3F']}
      style={styles.container}
    >
      <Text style={styles.heading}>What Parents Should Know</Text>
      <Text style={styles.summary}>{summary}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  heading: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  summary: {
    fontSize: theme.fontSize.base,
    fontFamily: theme.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 22,
  },
});
