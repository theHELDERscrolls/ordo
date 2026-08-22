import { movementTypeSchema, type MovementType } from '@ordo/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MovementBadge } from './MovementBadge';
import { MovementFormDialog } from './MovementFormDialog';
import { ProductPicker } from './ProductPicker';
import { signedQuantity } from './movement-format';
import { useMovements, type MovementFilters } from './useMovements';
import { dateTime, relativeTime } from '@/shared/format';
import { Pagination } from '@/shared/ui/Pagination';
import { buttonClasses } from '@/shared/ui/button-styles';

const LIMIT = 20;

const typeChips: { label: string; value: MovementType | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Entradas', value: 'in' },
  { label: 'Salidas', value: 'out' },
  { label: 'Ajustes', value: 'adjust' },
];

const dateInputClasses =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors outline-none focus:border-fg sm:w-40';

/**
 * The stock ledger: every recorded change, newest first, filtered and paginated.
 *
 * Registering is open to every role, unlike the rest of the app's writes: the person
 * behind the counter is the one who moves the stock, and a shop where each sale waits
 * for the owner is a shop that stops recording sales. The catalogue stays `admin`.
 */
export function MovementsPage() {
  // In the URL rather than in state, so the product sheet can link straight into its
  // own history and a filtered view is shareable. Parsing the type through the shared
  // enum makes a hand-edited value fall back to "all" instead of reaching the API.
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedType = movementTypeSchema.safeParse(searchParams.get('type'));
  const type = parsedType.success ? parsedType.data : undefined;
  const productId = searchParams.get('productId') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  // Through the router's updater form, so each change reads the params as they are at
  // that moment and one update cannot overwrite another made in the same tick.
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // Back to page one whenever the filters change. Adjusting state during render is
  // React's documented pattern here, and avoids an effect and its extra render.
  const filterKey = `${productId}|${type ?? ''}|${from}|${to}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filters: MovementFilters = {
    productId: productId || undefined,
    type,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: LIMIT,
  };
  const { data, isLoading, isError, error } = useMovements(filters);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(productId || type || from || to);

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="mt-1 text-sm text-fg-muted transition-colors">
            El historial de entradas, salidas y ajustes de tu stock.
          </p>
        </div>
        {/* Icon alone on a phone: the label does not fit beside the title, and a button
            that overflows the header is worse than one that has to be recognised. */}
        <button
          type="button"
          title="Registrar movimiento"
          aria-label="Registrar movimiento"
          onClick={() => setFormOpen(true)}
          className={`shrink-0 ${buttonClasses('primary')}`}
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Registrar movimiento</span>
        </button>
      </div>

      <div className="mt-8 space-y-3">
        <ProductPicker
          value={productId}
          onChange={(id) => setParam('productId', id)}
          placeholder="Todos los productos"
          clearable
        />
        <div className="flex flex-wrap items-center gap-2">
          {typeChips.map((chip) => {
            const active = type === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setParam('type', chip.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active ? 'border-fg bg-fg text-bg' : 'border-border text-fg-muted hover:text-fg'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setParam('from', e.target.value)}
            aria-label="Desde"
            className={`${dateInputClasses} sm:ml-auto`}
          />
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setParam('to', e.target.value)}
            aria-label="Hasta"
            className={dateInputClasses}
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-fg-muted">Cargando movimientos…</p>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-fg-muted">
            No se pudieron cargar los movimientos: {(error as Error).message}
          </p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">
              {hasFilters
                ? 'Ningún movimiento coincide con los filtros'
                : 'Aún no hay movimientos'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-fg-muted underline transition-colors hover:text-fg"
              >
                Limpiar filtros
              </button>
            ) : (
              <p className="mt-1 text-sm text-fg-muted">
                Cada entrada, salida o ajuste de stock aparecerá aquí.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-fg-muted uppercase">
                    <th className="py-2.5 pr-4 pl-3 font-medium">Producto</th>
                    <th className="py-2.5 pr-4 font-medium">Tipo</th>
                    <th className="py-2.5 pr-4 text-right font-medium">Cantidad</th>
                    <th className="py-2.5 pr-4 text-right font-medium">Stock resultante</th>
                    <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">Motivo</th>
                    <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">Usuario</th>
                    <th className="py-2.5 pr-3 text-right font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-3 pr-4 pl-3">
                        <span
                          className="block max-w-[14rem] truncate font-medium"
                          title={m.productName}
                        >
                          {m.productName || 'Producto eliminado'}
                        </span>
                        <span className="block text-xs text-fg-muted tabular-nums">
                          {m.productSku}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <MovementBadge type={m.type} />
                      </td>
                      <td className="py-3 pr-4 text-right font-medium tabular-nums">
                        {signedQuantity(m.type, m.quantity)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">{m.resultingStock}</td>
                      <td className="hidden py-3 pr-4 lg:table-cell">
                        <span
                          className="block max-w-[12rem] truncate text-sm text-fg-muted"
                          title={m.reason}
                        >
                          {m.reason ?? '—'}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-4 lg:table-cell">
                        <span className="block max-w-[9rem] truncate text-sm text-fg-muted">
                          {m.userName || '—'}
                        </span>
                      </td>
                      <td
                        className="py-3 pr-3 text-right text-sm text-fg-muted"
                        title={dateTime(m.createdAt)}
                      >
                        {relativeTime(m.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-border bg-surface p-4 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">
                      {m.productName || 'Producto eliminado'}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {signedQuantity(m.type, m.quantity)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <MovementBadge type={m.type} />
                      <span className="truncate text-xs text-fg-muted tabular-nums">
                        {m.productSku}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-fg-muted tabular-nums">
                      Stock: {m.resultingStock}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-3 text-xs text-fg-muted">
                    <span className="truncate">
                      {[m.reason, m.userName].filter(Boolean).join(' · ')}
                    </span>
                    <span className="shrink-0" title={dateTime(m.createdAt)}>
                      {relativeTime(m.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {/* Keyed on the filter: the dialog opens on the product the page is filtered by,
          and a key is what makes that initial value follow a filter change instead of
          sticking at whatever it was when the page first rendered. */}
      <MovementFormDialog
        key={productId}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productId={productId}
      />
    </div>
  );
}
