import { useSearchParams } from 'react-router-dom';

type Changes = Record<string, string | undefined>;
type SetOptions = { replace?: boolean; state?: unknown };

/**
 * The query string as a filter store: a list's filters live there rather than in
 * component state, so a filtered view is shareable, the panel can deep-link into
 * one and the phone's back button walks them.
 *
 * Writing goes through the router's updater form, so a change reads the params as
 * they are at that moment rather than as they were when the component rendered. It
 * takes every key at once for the same reason: two calls in one tick would both
 * start from the same URL, and the second would undo the first. An empty value
 * drops its parameter instead of leaving `?k=` behind.
 */
export function useUrlParams(): [URLSearchParams, (changes: Changes, options?: SetOptions) => void] {
  const [params, setSearchParams] = useSearchParams();

  const setParams = (changes: Changes, options?: SetOptions) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, options);

  return [params, setParams];
}
