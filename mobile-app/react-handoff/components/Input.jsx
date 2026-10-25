import React from 'react';
import Icon from './Icon';

/**
 * Form input with optional left icon and label.
 *
 * <Input label="Email" type="email" leftIcon="mail" placeholder="you@example.com" />
 */
export default function Input({ label, leftIcon, rightIcon, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="cp-label">{label}</span>}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Icon name={leftIcon} className="w-[18px] h-[18px]" />
          </span>
        )}
        <input
          className={`cp-field ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-ink-muted">
            <Icon name={rightIcon} className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>
    </label>
  );
}
