import React from 'react';

/**
 * Mobile screen shell — sets the 390×844 phone box and provides flex column.
 * Most screens render inside this for consistent sizing in design previews.
 * In production you can omit it and let your app shell handle viewport.
 */
export default function PhoneFrame({ children, className = '' }) {
  return <div className={`cp-phone ${className}`}>{children}</div>;
}
