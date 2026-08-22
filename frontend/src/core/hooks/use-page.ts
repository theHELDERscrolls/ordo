import { useState } from 'react';

/**
 * The current page of a list, back to the first whenever the filters change.
 * Without that reset, narrowing a list while on page four answers with an empty
 * page of a result that does have rows.
 *
 * @param filterKey Everything the query depends on, flattened into one string.
 *
 * Adjusting state during render is React's documented pattern for a value derived
 * from a change in props or state, and it avoids the effect and the second render
 * a `useEffect` would cost.
 */
export function usePage(filterKey: string) {
  const [page, setPage] = useState(1);
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setPage(1);
  }
  return [page, setPage] as const;
}
