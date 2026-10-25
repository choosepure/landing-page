import React from 'react';

/**
 * Circular safety-score badge (0-100). Color tier follows the Choosepure scale.
 * <ScoreBadge score={87} /> renders a 44px chip; pass `size` for other sizes.
 */
export default function ScoreBadge({ score, size = 44, className = '' }) {
  const tier = scoreTier(score);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-display font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: tier.bg,
        color: tier.fg,
        fontSize: Math.round(size * 0.42),
      }}
    >
      {score}
    </div>
  );
}

function scoreTier(s) {
  if (s >= 90) return { bg: '#D9E8DD', fg: '#2D6B4F' };
  if (s >= 80) return { bg: '#DCEAF4', fg: '#2C5F87' };
  if (s >= 70) return { bg: '#F0E5D5', fg: '#8B6F3D' };
  return         { bg: '#F4DDD4', fg: '#A8482E' };
}
