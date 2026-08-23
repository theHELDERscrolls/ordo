import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useDebounce } from '@/core/hooks/use-debounce';
import { useProduct } from '@/features/inventory/useProductMutations';
import { useProducts } from '@/features/inventory/useProducts';

type ProductPickerProps = {
  /** The selected product's id, or `''` for none. */
  value: string;
  onChange: (productId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  /** Shows a clear button, for a filter that can go back to "all products". */
  clearable?: boolean;
};

/**
 * Picks one product by typing. Not a plain dropdown: the catalogue runs past what
 * the list endpoint returns in one page, so the options cannot be loaded up front —
 * the search field *is* the filter, and the API answers with the matches.
 *
 * The selected product is held as an id, so the value survives a reload and a shared
 * URL; its name is read back through `useProduct`, which the inventory has usually
 * cached already.
 */
export function ProductPicker({
  value,
  onChange,
  label,
  placeholder = 'Buscar producto',
  className = '',
  clearable = false,
}: ProductPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(query, 300);
  const { data: selected } = useProduct(value || undefined);
  const { data } = useProducts({
    search: debounced || undefined,
    sort: 'name',
    order: 'asc',
    limit: 8,
  });
  const options = data?.items ?? [];

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const inputId = label ? `product-picker-${label}` : undefined;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium">
          {label}
        </label>
      )}
      <div className={`relative ${label ? 'mt-1.5' : ''}`}>
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
        />
        <input
          id={inputId}
          // While the list is open the field belongs to the search; closed, it goes
          // back to naming what is selected, so the control always reads as its value.
          value={open ? query : (selected?.name ?? '')}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full rounded-md border border-border bg-surface py-2 pr-8 pl-9 text-sm transition-colors outline-none focus:border-fg"
        />
        {clearable && value && (
          <button
            type="button"
            aria-label="Quitar el filtro de producto"
            onClick={() => {
              onChange('');
              setQuery('');
              setOpen(false);
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-fg-muted transition-colors hover:text-fg"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="scrollbar-slim absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-fg-muted">Ningún producto coincide</li>
          ) : (
            options.map((p) => (
              <li key={p.id} role="option" aria-selected={p.id === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                    p.id === value ? 'font-medium text-fg' : 'text-fg-muted'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-xs tabular-nums">{p.sku}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
