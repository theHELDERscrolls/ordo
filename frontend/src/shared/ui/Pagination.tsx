import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  /** Rows in the whole result, not in the page. */
  total: number;
  limit: number;
  onChange: (page: number) => void;
};

/**
 * The pager under a list: how much of the total is on screen, and the two steps.
 * Renders nothing when everything fits on one page.
 *
 * It stacks below `sm`: on a narrow phone the counter and the three controls do not
 * share a line without the counter being squeezed into one word per row, which is
 * what a `justify-between` does to it when there is no room left.
 */
export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  if (total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="mt-6 flex flex-col items-center gap-3 text-sm text-fg-muted sm:flex-row sm:justify-between sm:gap-4">
      <span className="tabular-nums">
        {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        {/* An arrow on a phone and the word from `sm` up: the two labels plus the
            page count are more than a narrow screen has room for, and a step back
            or forward is the one control an arrow says on its own. */}
        <button
          type="button"
          aria-label="Anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex items-center rounded-md border border-border px-3 py-1.5 transition-colors hover:text-fg disabled:opacity-40"
        >
          <ChevronLeft size={16} strokeWidth={2} className="sm:hidden" />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <span className="px-2 tabular-nums">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          aria-label="Siguiente"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="flex items-center rounded-md border border-border px-3 py-1.5 transition-colors hover:text-fg disabled:opacity-40"
        >
          <ChevronRight size={16} strokeWidth={2} className="sm:hidden" />
          <span className="hidden sm:inline">Siguiente</span>
        </button>
      </div>
    </div>
  );
}
