import type { ReactNode } from 'react';

type ListStateProps = {
  title: string;
  /**
   * Quiet, for a state the user did not cause: still loading, or a request that
   * failed. An empty result is stated plainly instead.
   */
  muted?: boolean;
  hint?: string;
  /** Clears the filters, when it is the filters that emptied the list. */
  onClear?: () => void;
  children?: ReactNode;
};

/** The centred block a list falls back to: loading, failed, or nothing to show. */
export function ListState({ title, muted, hint, onClear, children }: ListStateProps) {
  return (
    <div className="py-16 text-center">
      <p className={muted ? 'text-sm text-fg-muted' : 'text-sm font-medium'}>{title}</p>
      {hint && <p className="mt-1 text-sm text-fg-muted">{hint}</p>}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 text-sm text-fg-muted underline transition-colors hover:text-fg"
        >
          Limpiar filtros
        </button>
      )}
      {children}
    </div>
  );
}
