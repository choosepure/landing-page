import React from 'react';
import ScoreBadge from './ScoreBadge';
import NutriGradeBadge from './NutriGradeBadge';

/**
 * Horizontal product list row — name, brand, optional category, badge on the right.
 * Pass `score` (0-100) for circular safety badge OR `grade` (A-E) for square nutri badge.
 */
export default function ProductCard({
  name, brand, meta, score, grade,
  imageGradient = 'linear-gradient(135deg, #E8DCC4, #B89A6F)',
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 cp-card text-left active:scale-[0.99] transition"
    >
      <div className="w-14 h-14 rounded-md flex-shrink-0" style={{ background: imageGradient }} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-md text-ink truncate">{name}</div>
        {brand && <div className="text-sm text-ink-muted truncate">{brand}</div>}
        {meta && <div className="text-xs text-ink-dim mt-0.5">{meta}</div>}
      </div>
      {grade && <NutriGradeBadge grade={grade} size={36} />}
      {score != null && <ScoreBadge score={score} size={44} />}
    </button>
  );
}
