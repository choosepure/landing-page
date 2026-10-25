import React from 'react';

/**
 * Choosepure button. Variants:
 *   - primary  (default) — green-800 fill
 *   - secondary           — soft cream fill, dark text
 *   - ghost               — transparent, dark text
 *   - danger              — red fill
 *   - outline             — transparent + green-800 border
 *
 * Sizes: sm | md (default) | lg
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-50';
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-3 text-base rounded-lg',
    lg: 'px-5 py-4 text-base rounded-lg',
  };
  const variants = {
    primary:   'bg-green-800 text-white hover:bg-green-900',
    secondary: 'bg-green-50  text-green-800 hover:bg-green-100',
    ghost:     'bg-transparent text-green-800 hover:bg-green-50',
    danger:    'bg-nutri-e text-white hover:opacity-90',
    outline:   'bg-transparent text-green-800 border border-green-800',
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
