import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const GRADE_COLORS = {
  A: { bg: '#1E8449', text: '#FFFFFF' },
  B: { bg: '#7CB342', text: '#FFFFFF' },
  C: { bg: '#F4C430', text: '#1A201A' },
  D: { bg: '#E89B3C', text: '#FFFFFF' },
  E: { bg: '#D14E36', text: '#FFFFFF' },
};

/**
 * Returns the background and text color pair for a Nutri-Score grade.
 * Falls back to Grade C colors for invalid grades.
 * Exported for reuse in other components.
 */
export function getNutriGradeColor(grade) {
  return GRADE_COLORS[grade] || GRADE_COLORS.C;
}

/**
 * Square A-E Nutri-Score badge with grade-specific colors.
 *
 * Usage:
 *   <NutriGradeBadge grade="A" />
 *   <NutriGradeBadge grade="B" size={36} />
 */
export default function NutriGradeBadge({ grade, size = 40 }) {
  const colors = getNutriGradeColor(grade);
  const fontSize = Math.round(size * 0.55);
  const displayGrade = GRADE_COLORS[grade] ? grade : 'C';

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          backgroundColor: colors.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          {
            color: colors.text,
            fontSize,
          },
        ]}
      >
        {displayGrade}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: theme.fonts.bold,
  },
});
