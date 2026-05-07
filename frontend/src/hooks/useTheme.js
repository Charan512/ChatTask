/**
 * src/hooks/useTheme.js — Dark/Light mode toggle hook.
 *
 * Persists the user's theme preference in localStorage.
 * Adds/removes the 'dark' class on <html> to drive Tailwind's darkMode: 'class'.
 */

import { useState, useEffect } from 'react';

const THEME_KEY = 'vb_theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    // Default: light mode (override OS preference)
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
}
