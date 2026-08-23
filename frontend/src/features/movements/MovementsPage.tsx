import { movementTypeSchema, type MovementType } from '@ordo/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { MovementBadge } from './MovementBadge';
import { MovementFormDialog } from './MovementFormDialog';
import { ProductPicker } from './ProductPicker';
import { signedQuantity } from './movement-format';
import { useMovements, type MovementFilters } from './useMovements';
import { usePage } from '@/core/hooks/use-page';
import { useUrlParams } from '@/core/hooks/use-url-params';
import { dateTime, relativeTime } from '@/shared/format';
import { FilterChips } from '@/shared/ui/FilterChips';
import { ListState } from '@/shared/ui/ListState';
import { Page, PageHeader } from '@/shared/ui/Page';
import { Pagination } from '@/shared/ui/Pagination';
import { buttonClasses } from '@/shared/ui/button-styles';
import { fieldClasses } from '@/shared/ui/field-styles';
import { tableHeadClasses } from '@/shared/ui/table-styles';

const LIMIT = 20;

const typeChips: { label: string; value: MovementType | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Entradas', value: 'in' },
  { label: 'Salidas', value: 'out' },
  { label: 'Ajustes', value: 'adjust' },
];

const dateClasses = `${fieldClasses()} sm:w-40`;

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
  const [params, setParams] = useUrlParams();
  const parsedType = movementTypeSchema.safeParse(params.get('type'));
  const type = parsedType.success ? parsedType.data : undefined;
  const productId = params.get('productId') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const setFilter = (changes: Record<string, string | undefined>) =>
    setParams(changes, { replace: true });

  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = usePage(`${productId}|${type ?? ''}|${from}|${to}`);

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

  const clearFilters = () =>
    setFilter({ productId: undefined, type: undefined, from: undefined, to: undefined });

  return (
    <Page>
      <PageHeader
        title="Movimientos"
        description="El historial de entradas, salidas y ajustes de tu stock."
      >
        {/* Icon alone on a phone: the label does not fit beside the title, and a button
            that overflows the header is worse than one that has to be recognised. */}
        <button
          type="button"
          title="Registrar movimiento"
          aria-label="Registrar movimiento"
          onClick={() => setFormOpen(true)}
          className={buttonClasses('primary')}
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Registrar movimiento</span>
        </button>
      </PageHeader>

      <div className="mt-8 space-y-3">
        <ProductPicker
          value={productId}
          onChange={(id) => setFilter({ productId: id })}
          placeholder="Todos los productos"
          clearable
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            options={typeChips}
            value={type}
            onChange={(value) => setFilter({ type: value })}
          />
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFilter({ from: e.target.value })}
            aria-label="Desde"
            className={`${dateClasses} sm:ml-auto`}
          />
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setFilter({ to: e.target.value })}
            aria-label="Hasta"
            className={dateClasses}
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <ListState muted title="Cargando movimientos…" />
        ) : isError ? (
          <ListState
            muted
            title={`No se pudieron cargar los movimientos: ${(error as Error).message}`}
          />
        ) : items.length === 0 ? (
          hasFilters ? (
            <ListState title="Ningún movimiento coincide con los filtros" onClear={clearFilters} />
          ) : (
            <ListState
              title="Aún no hay movimientos"
              hint="Cada entrada, salida o ajuste de stock aparecerá aquí."
            />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className={tableHeadClasses}>
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
    </Page>
  );
}
