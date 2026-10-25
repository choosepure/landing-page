import React from 'react';

/**
 * Card — white surface with the standard Choosepure shadow + border.
 * Pass `as` to render a different element (e.g. `as="button"` for tappable cards).
 */
export default function Card({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As className={`cp-card ${className}`} {...rest}>
      {children}
    </As>
  );
}
