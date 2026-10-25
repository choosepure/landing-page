import React from 'react';

/** iOS-ish status bar dummy. Use inside <PhoneFrame>. */
export default function StatusBar({ dark = false }) {
  const fg = dark ? '#fff' : '#1A201A';
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-2 text-2xs font-semibold" style={{ color: fg, height: 44 }}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        {/* Cellular */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill={fg}><rect x="0" y="6" width="2.5" height="4" rx="0.5"/><rect x="4" y="4" width="2.5" height="6" rx="0.5"/><rect x="8" y="2" width="2.5" height="8" rx="0.5"/><rect x="12" y="0" width="2.5" height="10" rx="0.5"/></svg>
        {/* Wifi */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill={fg}><path d="M7 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM2 4.2a7 7 0 0 1 10 0l-1.4 1.4a5 5 0 0 0-7.2 0L2 4.2zM4 6.5a4 4 0 0 1 6 0l-1.4 1.4a2 2 0 0 0-3.2 0L4 6.5z"/></svg>
        {/* Battery */}
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={fg}/><rect x="2" y="2" width="15" height="6" rx="1" fill={fg}/><rect x="19.5" y="3.5" width="1.5" height="3" rx="0.4" fill={fg}/></svg>
      </div>
    </div>
  );
}
