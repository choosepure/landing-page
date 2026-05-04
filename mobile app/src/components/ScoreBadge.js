import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * Returns tier colors for a given safety score (0-100).
 * Exported for reuse in other components.
 */
export function scoreTier(score) {
  if (score >= 90) return { bg: '#D9E8DD', fg: '#2D6B4F' };
  if (score >= 80) return { bg: '#DCEAF4', fg: '#2C5F87' };
  if (score >= 70) return { bg: '#F0E5D5', fg: '#8B6F3D' };
  return { bg: '#F4DDD4', fg: '#A8482E' };
}

/**
 * Circular safety-score badge (0-100). Color tier follows the ChoosePure scale.
 *
 * Usage:
 *   <ScoreBadge score={87} />
 *   <ScoreBadge score={92} size={64} />
 */
export default function ScoreBadge({ score, size = 44 }) {
  const tier = scoreTier(score);
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tier.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: tier.fg,
            fontSize,
          },
        ]}
      >
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fonts.semiBold,
  },
});
