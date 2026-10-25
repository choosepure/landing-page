import React from 'react';

/**
 * Stroke icon set used across the app. All icons are 24×24 viewBox,
 * inherit `currentColor`, and accept className.
 *
 * Usage:
 *   <Icon name="scan" className="w-5 h-5 text-green-700" />
 */
export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.7, ...rest }) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
  switch (name) {
    case 'home':         return <svg {...props}><path d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-3v-7H10v7H5a2 2 0 0 1-2-2z"/></svg>;
    case 'scan':         return <svg {...props}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>;
    case 'scan-corners': return <svg {...props}><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/></svg>;
    case 'flask':        return <svg {...props}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 14h9"/></svg>;
    case 'tag':          return <svg {...props}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>;
    case 'user':         return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'clock':        return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'search':       return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'arrow-left':   return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'arrow-right':  return <svg {...props}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'chevron-right':return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'check':        return <svg {...props}><path d="m5 12 5 5L20 7"/></svg>;
    case 'check-circle': return <svg {...props} fill="currentColor"><circle cx="12" cy="12" r="10" stroke="none"/><path d="m8 12 3 3 5-6" stroke="#fff" strokeWidth="2.4"/></svg>;
    case 'close':        return <svg {...props}><path d="M6 6l12 12M6 18 18 6"/></svg>;
    case 'eye':          return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'mail':         return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case 'phone':        return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6A2 2 0 0 1 22 16.9z"/></svg>;
    case 'flash':        return <svg {...props} fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" stroke="none"/></svg>;
    case 'image':        return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'info':         return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
    case 'shield-check': return <svg {...props}><path d="M12 2 4 5v6.5c0 5 3.4 9 8 10 4.6-1 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'leaf':         return <svg {...props} fill="currentColor"><path d="M11 20A7 7 0 0 1 9.8 6.6 7 7 0 0 1 21 12c0 4.4-3.6 8-8 8-1.5 0-3-.4-4-1z" stroke="none"/></svg>;
    case 'gift':         return <svg {...props}><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13M8 8a2 2 0 1 1 0-4c1 0 2 1 4 4M16 8a2 2 0 1 0 0-4c-1 0-2 1-4 4"/></svg>;
    case 'star':         return <svg {...props} fill="currentColor"><path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z" stroke="none"/></svg>;
    case 'plus':         return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'bell':         return <svg {...props}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 0 1-4 0"/></svg>;
    case 'lock':         return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'help':         return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>;
    case 'logout':       return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'share':        return <svg {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>;
    case 'sliders':      return <svg {...props}><path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>;
    case 'warn-tri':     return <svg {...props}><path d="m10.3 3.9-8 13.6A2 2 0 0 0 4 20.5h16a2 2 0 0 0 1.7-3l-8-13.6a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
    default: return null;
  }
}
