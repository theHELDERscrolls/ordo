import { useEffect, useState } from 'react';

// Delays reflecting a fast-changing value until it stops changing for `delay` ms,
// so a search field triggers one request when typing settles instead of one per
// keystroke. Debounce (wait for a pause) fits search better than throttle (fire at
// a fixed rate); React Query then dedupes and caches per resulting query.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
