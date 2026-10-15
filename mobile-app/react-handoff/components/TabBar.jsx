import React from 'react';
import Icon from './Icon';

/**
 * Bottom tab bar. Pass `items` to override or use a preset variant.
 */
export const TAB_PRESETS = {
  v1: [
    { id: 'home',    icon: 'home',  label: 'Home' },
    { id: 'scan',    icon: 'scan',  label: 'Scan' },
    { id: 'history', icon: 'clock', label: 'History' },
    { id: 'profile', icon: 'user',  label: 'Profile' },
  ],
  v2: [
    { id: 'home',    icon: 'home',  label: 'Home' },
    { id: 'lab',     icon: 'flask', label: 'Lab' },
    { id: 'label',   icon: 'tag',   label: 'Label' },
    { id: 'profile', icon: 'user',  label: 'Profile' },
  ],
  v3: [
    { id: 'home',    icon: 'home',  label: 'Home' },
    { id: 'lab',     icon: 'flask', label: 'Lab' },
    { id: 'scan',    icon: 'scan',  label: 'Scan' },
    { id: 'label',   icon: 'tag',   label: 'Label' },
    { id: 'profile', icon: 'user',  label: 'Profile' },
  ],
};

export default function TabBar({ active, onTab, items = TAB_PRESETS.v1 }) {
  return (
    <nav className="flex items-stretch border-t border-line-soft bg-white pb-safe-bottom">
      {items.map(it => {
        const isActive = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onTab?.(it.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-2xs font-semibold ${
              isActive ? 'text-green-800' : 'text-ink-muted'
            }`}
          >
            <Icon name={it.icon} className={`w-6 h-6 ${isActive ? 'text-green-800' : 'text-ink-muted'}`} strokeWidth={isActive ? 2 : 1.7} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
