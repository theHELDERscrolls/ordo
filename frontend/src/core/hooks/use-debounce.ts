import { useEffect, useState } from 'react';

/**
 * Holds a fast-changing value back until it has been still for `delay` ms, so a
 * search field fires one request when typing settles rather than one per keystroke.
 * Debouncing (wait for a pause) suits search better than throttling (fire at a
 * fixed rate); React Query then dedupes and caches per resulting query.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
