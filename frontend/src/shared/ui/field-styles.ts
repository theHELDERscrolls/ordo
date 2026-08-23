const base =
  'w-full rounded-md border bg-surface px-3 py-2 text-sm transition-colors outline-none';

/**
 * The chassis every field shares — the text inputs, the date bounds and the
 * dropdown's own button — so a control cannot end up a pixel off the rest.
 *
 * The border is resolved here rather than appended by the caller: valid and invalid
 * set the same property, and which one wins would otherwise depend on the order
 * Tailwind emits them in, not on the order they are written.
 */
export function fieldClasses(invalid = false): string {
  return `${base} ${
    invalid ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-fg'
  }`;
}
