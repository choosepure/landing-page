import React from 'react';
import { NUTRI_GRADES } from '../tokens';

/**
 * Square A-E Nutri-Score badge.
 * <NutriGradeBadge grade="A" size={40} />
 */
export default function NutriGradeBadge({ grade, size = 40, className = '' }) {
  const g = NUTRI_GRADES.find(x => x.grade === grade) || NUTRI_GRADES[2];
  return (
    <div
      className={`rounded-md flex items-center justify-center font-display font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: g.bg,
        color: g.text,
        fontSize: Math.round(size * 0.55),
      }}
    >
      {g.grade}
    </div>
  );
}
