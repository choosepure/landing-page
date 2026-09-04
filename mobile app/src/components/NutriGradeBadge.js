import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { getNutriScoreToken, NUTRI_SCORE_TOKENS } from '../utils/scoreTokens';

const darkTextGrades = ['C'];

/**
 * Returns the background and text color pair for a Nutri-Score grade.
 * Falls back to Grade C colors for invalid grades.
 * Exported for reuse in other components.
 */
export function getNutriGradeColor(grade) {
  const token = getNutriScoreToken(grade);
  const bg = token.color;
  const text = darkTextGrades.includes((grade || '').toUpperCase()) ? '#1A201A' : '#FFFFFF';
  return { bg, text };
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
  const displayGrade = NUTRI_SCORE_TOKENS[grade] ? grade : 'C';

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
