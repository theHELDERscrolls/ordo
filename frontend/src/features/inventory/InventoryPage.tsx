import { stockStatusSchema, type StockStatus } from '@ordo/shared';
import { Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useFacets } from './useFacets';
import { useProducts, type ProductFilters } from './useProducts';
import { useAuth } from '@/core/auth/use-auth';
import { useDebounce } from '@/core/hooks/use-debounce';
import { money } from '@/shared/format';
import { RowLink } from '@/shared/ui/RowLink';
import { Select } from '@/shared/ui/Select';
import { StockBadge } from '@/shared/ui/StockBadge';
import { buttonClasses } from '@/shared/ui/button-styles';

const LIMIT = 20;

const stockChips: { label: string; value: StockStatus | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Stock bajo', value: 'low' },
  { label: 'Agotado', value: 'out' },
];

const sortOptions = [
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'salePrice-asc', label: 'Precio (menor a mayor)' },
  { value: 'salePrice-desc', label: 'Precio (mayor a menor)' },
  { value: 'stock-asc', label: 'Stock (menor a mayor)' },
  { value: 'stock-desc', label: 'Stock (mayor a menor)' },
];

/** The catalogue: search, filters, sorting and pagination over the tenant's products. */
export function InventoryPage() {
  const auth = useAuth();
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'admin';

  // In the URL rather than in state, so the panel's cards can link straight to a
  // filtered inventory. Parsing through the shared enum makes a hand-edited value
  // fall back to "all" instead of reaching the API.
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedStatus = stockStatusSchema.safeParse(searchParams.get('stockStatus'));
  const stockStatus = parsedStatus.success ? parsedStatus.data : undefined;
  const setStockStatus = (value: StockStatus | undefined) =>
    setSearchParams(value ? { stockStatus: value } : {}, { replace: true });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [sortValue, setSortValue] = useState('name-asc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const [sort, order] = sortValue.split('-') as [string, 'asc' | 'desc'];

  // Back to page one whenever the filters change. Adjusting state during render is
  // React's documented pattern here, and avoids an effect and its extra render.
  const filterKey = `${debouncedSearch}|${stockStatus ?? ''}|${category}|${supplier}|${sortValue}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filters: ProductFilters = {
    search: debouncedSearch || undefined,
    stockStatus,
    category: category || undefined,
    supplier: supplier || undefined,
    sort,
    order,
    page,
    limit: LIMIT,
  };
  const { data, isLoading, isError, error } = useProducts(filters);
  const { data: facets } = useFacets();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const start = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);
  const categories = facets?.categories ?? [];
  const suppliers = facets?.suppliers ?? [];
  const hasFilters =
    Boolean(debouncedSearch || category || supplier) || stockStatus !== undefined;

  function clearFilters() {
    setSearch('');
    setStockStatus(undefined);
    setCategory('');
    setSupplier('');
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-fg-muted transition-colors">
            Gestiona tu catálogo y los niveles de stock.
          </p>
        </div>
        {isAdmin && (
          <Link to="/inventory/new" className={`shrink-0 ${buttonClasses('primary')}`}>
            <Plus size={16} strokeWidth={2} />
            Nuevo producto
          </Link>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-fg"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stockChips.map((chip) => {
            const active = stockStatus === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setStockStatus(chip.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active ? 'border-fg bg-fg text-bg' : 'border-border text-fg-muted hover:text-fg'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
          <Select
            value={category}
            onChange={setCategory}
            ariaLabel="Categoría"
            className="w-full sm:w-44"
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            value={supplier}
            onChange={setSupplier}
            ariaLabel="Proveedor"
            className="w-full sm:w-44"
            options={[
              { value: '', label: 'Todos los proveedores' },
              ...suppliers.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            value={sortValue}
            onChange={setSortValue}
            ariaLabel="Ordenar por"
            className="w-full sm:ml-auto sm:w-56"
            options={sortOptions}
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-fg-muted">Cargando productos…</p>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-fg-muted">
            No se pudieron cargar los productos: {(error as Error).message}
          </p>
        ) : items.length === 0 ? (
          hasFilters ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium">Ningún producto coincide con los filtros</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-fg-muted underline transition-colors hover:text-fg"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-medium">Aún no hay productos</p>
              {isAdmin && (
                <>
                  <p className="mt-1 text-sm text-fg-muted">
                    Añade tu primer producto para empezar a controlar el stock.
                  </p>
                  <Link to="/inventory/new" className={`mt-4 ${buttonClasses('primary')}`}>
                    Nuevo producto
                  </Link>
                </>
              )}
            </div>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2.5 pl-3 pr-4 font-medium">Producto</th>
                    <th className="py-2.5 pr-4 font-medium">SKU</th>
                    <th className="py-2.5 pr-4 font-medium">Categoría</th>
                    <th className="py-2.5 pr-4 font-medium">Proveedor</th>
                    <th className="py-2.5 pr-4 font-medium">Estado</th>
                    <th className="py-2.5 pl-4 text-right font-medium">Stock</th>
                    <th className="py-2.5 pl-4 pr-3 text-right font-medium">Precio venta</th>
                    {isAdmin && (
                      <th className="py-2.5 pl-4 pr-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b border-border transition-colors hover:bg-surface">
                      <td className="py-3 pl-3 pr-4">
                        <RowLink
                          to={`/inventory/${p.id}/edit`}
                          active={isAdmin}
                          className="block max-w-[13rem] truncate font-medium"
                          title={p.name}
                        >
                          {p.name}
                        </RowLink>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="block max-w-[8rem] truncate text-sm tabular-nums text-fg-muted"
                          title={p.sku}
                        >
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="block max-w-[9rem] truncate text-sm text-fg-muted"
                          title={p.category ?? undefined}
                        >
                          {p.category ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="block max-w-[9rem] truncate text-sm text-fg-muted"
                          title={p.supplier ?? undefined}
                        >
                          {p.supplier ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StockBadge status={p.stockStatus} />
                      </td>
                      <td className="py-3 pl-4 text-right tabular-nums">{p.stock}</td>
                      <td className="py-3 pl-4 pr-3 text-right tabular-nums">{money(p.salePrice)}</td>
                      {isAdmin && (
                        <td className="py-3 pl-4 pr-3 text-right">
                          <Link
                            to={`/inventory/${p.id}/edit`}
                            aria-label="Editar producto"
                            title="Editar producto"
                            className="inline-flex rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                          >
                            <Pencil size={16} strokeWidth={1.75} />
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden">
              {items.map((p) => {
                const inner = (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="tabular-nums">{money(p.salePrice)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-sm text-fg-muted">
                      <span className="tabular-nums">
                        {p.sku}
                        {p.category ? ` · ${p.category}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-2 tabular-nums">
                        <StockBadge status={p.stockStatus} />
                        {p.stock}
                      </span>
                    </div>
                  </>
                );
                return (
                  <li key={p.id}>
                    <RowLink
                      to={`/inventory/${p.id}/edit`}
                      active={isAdmin}
                      as="div"
                      className="block rounded-lg border border-border bg-surface p-4 transition-colors"
                    >
                      {inner}
                    </RowLink>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {total > LIMIT && (
        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-fg-muted">
          <span className="tabular-nums">
            {start}–{end} de {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-border px-3 py-1.5 transition-colors hover:text-fg disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 tabular-nums">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border px-3 py-1.5 transition-colors hover:text-fg disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
