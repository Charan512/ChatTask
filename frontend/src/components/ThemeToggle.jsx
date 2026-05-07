/**
 * src/components/ThemeToggle.jsx — Light/Dark mode switch button.
 *
 * Renders a smooth pill-style toggle with sun (light) and moon (dark) icons.
 * Uses only Tailwind utility classes — no custom CSS.
 */

import React from 'react';

// Sun icon (light mode)
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// Moon icon (dark mode)
function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * @param {{ isDark: boolean, onToggle: function }} props
 */
export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-300 cursor-pointer select-none
        ${isDark
          ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30 hover:bg-brand-purple/30'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
        }
      `}
    >
      {isDark ? (
        <>
          <MoonIcon />
          <span>Dark</span>
        </>
      ) : (
        <>
          <SunIcon />
          <span>Light</span>
        </>
      )}
    </button>
  );
}
