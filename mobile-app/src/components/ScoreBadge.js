import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { getLabScoreToken } from '../utils/scoreTokens';

/**
 * @deprecated Use getLabScoreToken from scoreTokens.js directly.
 * Kept for backwards-compat with any callers that imported scoreTier.
 */
export function scoreTier(score) {
  const token = getLabScoreToken(score);
  // Map to legacy { bg, fg } shape
  const fgMap = {
    '#2E7D32': '#fff',
    '#7CB342': '#fff',
    '#E8A33D': '#fff',
    '#D64545': '#fff',
  };
  return { bg: token.color + '33', fg: token.color };
}

/**
 * Circular Lab Score badge (0–100) with "Lab Score" caption below.
 * Uses the shared Score Token System for semantically correct colors.
 *
 * - Shape: circle (differentiates from NutriGradeBadge square)
 * - Caption: always shows "Lab Score" so it cannot be misread as Nutri-Score
 * - Color: token-driven red→amber→green scale
 *
 * Usage:
 *   <ScoreBadge score={87} />
 *   <ScoreBadge score={92} size={48} />
 */
export default function ScoreBadge({ score, size = 44 }) {
  const token = getLabScoreToken(score ?? 0);
  const fontSize = Math.round(size * 0.38);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: token.color,
          },
        ]}
      >
        <Text style={[styles.number, { fontSize, color: '#FFFFFF' }]}>
          {score ?? '—'}
        </Text>
      </View>
      <Text style={styles.caption}>Lab Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flexShrink: 0,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: theme.fonts.bold,
    lineHeight: undefined,
  },
  caption: {
    fontFamily: theme.fonts.regular,
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
