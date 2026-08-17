import { useEffect, useState } from 'react';

const THEME_KEY = 'ordo_theme';
type Theme = 'light' | 'dark';

/**
 * The invertible theme: remembers the choice and falls back to the OS preference.
 * Toggling flips the `dark` class on `<html>`, which swaps every neutral token.
 *
 * @returns The active theme and a function that inverts it.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return [theme, toggle];
}
