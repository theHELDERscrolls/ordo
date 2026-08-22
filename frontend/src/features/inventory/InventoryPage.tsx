import { stockStatusSchema, type StockStatus } from '@ordo/shared';
import { Download, Plus, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ImportDialog } from './ImportDialog';
import { ProductDetailDialog } from './ProductDetailDialog';
import { useFacets } from './useFacets';
import { useExportProducts } from './useProductCsv';
import { useProducts, type ProductFilters } from './useProducts';
import { useAuth } from '@/core/auth/use-auth';
import { useDebounce } from '@/core/hooks/use-debounce';
import { usePage } from '@/core/hooks/use-page';
import { useUrlParams } from '@/core/hooks/use-url-params';
import { money } from '@/shared/format';
import { FilterChips } from '@/shared/ui/FilterChips';
import { ListState } from '@/shared/ui/ListState';
import { Page, PageHeader } from '@/shared/ui/Page';
import { Pagination } from '@/shared/ui/Pagination';
import { Select } from '@/shared/ui/Select';
import { StockBadge } from '@/shared/ui/StockBadge';
import { buttonClasses } from '@/shared/ui/button-styles';
import { fieldClasses } from '@/shared/ui/field-styles';
import { tableHeadClasses } from '@/shared/ui/table-styles';

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
  // filtered inventory and a single product is shareable. Parsing through the shared
  // enum makes a hand-edited value fall back to "all" instead of reaching the API.
  const [params, setParams] = useUrlParams();
  const navigate = useNavigate();
  const location = useLocation();
  const parsedStatus = stockStatusSchema.safeParse(params.get('stockStatus'));
  const stockStatus = parsedStatus.success ? parsedStatus.data : undefined;
  const openProductId = params.get('product');

  const setStockStatus = (value: StockStatus | undefined) =>
    setParams({ stockStatus: value }, { replace: true });

  // Opening pushes a history entry, so the phone's back button closes the sheet, and
  // marks it as ours. Closing walks that entry back when we own it, which keeps the
  // stack clean; a sheet reached any other way — a shared link, a save returning to
  // it — has nothing of ours behind it, so it rewrites the current entry instead.
  const openProduct = (id: string) => setParams({ product: id }, { state: { sheet: true } });

  const closeProduct = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else setParams({ product: undefined }, { replace: true });
  };

  // Local state and not the URL: half an import is nothing to link to.
  const [importing, setImporting] = useState(false);
  const exportCsv = useExportProducts();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [sortValue, setSortValue] = useState('name-asc');

  const debouncedSearch = useDebounce(search, 300);
  const [sort, order] = sortValue.split('-') as [string, 'asc' | 'desc'];
  const [page, setPage] = usePage(
    `${debouncedSearch}|${stockStatus ?? ''}|${category}|${supplier}|${sortValue}`,
  );

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
    <Page>
      <PageHeader title="Inventario" description="Gestiona tu catálogo y los niveles de stock.">
        {/* The CSV actions keep their label from `sm` up and shrink to their icon on a
            phone, where three labelled buttons would not fit beside the title. */}
        <button
          type="button"
          title="Exportar CSV"
          aria-label="Exportar CSV"
          disabled={exportCsv.isPending}
          onClick={() => exportCsv.mutate(filters)}
          className={buttonClasses('secondary')}
        >
          <Download size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
        {isAdmin && (
          <>
            <button
              type="button"
              title="Importar CSV"
              aria-label="Importar CSV"
              onClick={() => setImporting(true)}
              className={buttonClasses('secondary')}
            >
              <Upload size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Importar CSV</span>
            </button>
            <Link
              to="/inventory/new"
              title="Nuevo producto"
              aria-label="Nuevo producto"
              className={buttonClasses('primary')}
            >
              <Plus size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Nuevo producto</span>
            </Link>
          </>
        )}
      </PageHeader>

      {exportCsv.isError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          No se pudo exportar el CSV: {(exportCsv.error as Error).message}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            className={`${fieldClasses()} pl-9`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips options={stockChips} value={stockStatus} onChange={setStockStatus} />
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
          <ListState muted title="Cargando productos…" />
        ) : isError ? (
          <ListState
            muted
            title={`No se pudieron cargar los productos: ${(error as Error).message}`}
          />
        ) : items.length === 0 ? (
          hasFilters ? (
            <ListState title="Ningún producto coincide con los filtros" onClear={clearFilters} />
          ) : (
            <ListState
              title="Aún no hay productos"
              hint={
                isAdmin ? 'Añade tu primer producto para empezar a controlar el stock.' : undefined
              }
            >
              {isAdmin && (
                <Link to="/inventory/new" className={`mt-4 ${buttonClasses('primary')}`}>
                  Nuevo producto
                </Link>
              )}
            </ListState>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className={tableHeadClasses}>
                    <th className="py-2.5 pr-4 pl-3 font-medium">Producto</th>
                    <th className="py-2.5 pr-4 font-medium">SKU</th>
                    <th className="py-2.5 pr-4 font-medium">Categoría</th>
                    <th className="py-2.5 pr-4 font-medium">Proveedor</th>
                    <th className="py-2.5 pr-4 font-medium">Estado</th>
                    <th className="py-2.5 pl-4 text-right font-medium">Stock</th>
                    <th className="py-2.5 pr-3 pl-4 text-right font-medium">Precio venta</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      // Not while text is being selected: dragging across a cell to
                      // copy a SKU ends in a click on the row, and would otherwise
                      // throw away the selection and open the sheet.
                      onClick={() => {
                        if (window.getSelection()?.isCollapsed !== false) openProduct(p.id);
                      }}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-surface"
                    >
                      <td className="py-3 pr-4 pl-3">
                        {/* The button carries no handler of its own: pressing Enter on it
                            fires a click that bubbles to the row, so the row keeps a single
                            handler and stays reachable from the keyboard. */}
                        <button
                          type="button"
                          aria-label={`Ver ${p.name}`}
                          title={p.name}
                          className="block max-w-[13rem] truncate text-left font-medium"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="block max-w-[8rem] truncate text-sm text-fg-muted tabular-nums"
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
                      <td className="py-3 pr-3 pl-4 text-right tabular-nums">
                        {money(p.salePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden">
              {items.map((p) => {
                // Spans rather than divs: the card is a button now, and a button only
                // takes phrasing content.
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => openProduct(p.id)}
                      className="block w-full rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-fg"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{p.name}</span>
                        <span className="tabular-nums">{money(p.salePrice)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3 text-sm text-fg-muted">
                        <span className="tabular-nums">
                          {p.sku}
                          {p.category ? ` · ${p.category}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-2 tabular-nums">
                          <StockBadge status={p.stockStatus} />
                          {p.stock}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      <ProductDetailDialog productId={openProductId} onClose={closeProduct} />
      <ImportDialog open={importing} onClose={() => setImporting(false)} />
    </Page>
  );
}
