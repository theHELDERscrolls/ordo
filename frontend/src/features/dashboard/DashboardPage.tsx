import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

import { useDashboardStats } from './useDashboardStats';
import { useInventoryBreakdown } from './useInventoryBreakdown';
import { useAuth } from '@/core/auth/use-auth';
import { money } from '@/shared/format';
import { Page, PageHeader } from '@/shared/ui/Page';
import { StatCard } from '@/shared/ui/StatCard';

const InventoryCharts = lazy(() => import('./charts/InventoryCharts'));

/**
 * The panel: the four figures the whole inventory can be read from, then the two
 * charts. The stock cards link into the inventory already filtered by that status,
 * so what needs attention is one tap away.
 */
export function DashboardPage() {
  const auth = useAuth();
  const { data, isLoading, isError, error } = useDashboardStats();
  const breakdown = useInventoryBreakdown();

  if (auth.status !== 'authenticated') return null;
  const isAdmin = auth.user.role === 'admin';

  const low = data?.lowStockCount ?? 0;
  const out = data?.outOfStockCount ?? 0;
  // null means "no figure yet" (loading or failed) and renders as a dash.
  const figure = (value: string) => (data ? value : null);

  return (
    <Page width="medium">
      <PageHeader title="Panel" description="El estado de tu inventario ahora mismo." />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Productos"
          value={figure(String(data?.productCount ?? 0))}
          hint="En el catálogo"
          to="/inventory"
          loading={isLoading}
        />
        <StatCard
          label="Valor de inventario"
          value={figure(money(data?.inventoryValue ?? 0))}
          hint="A precio de coste"
          loading={isLoading}
        />
        <StatCard
          label="Stock bajo"
          value={figure(String(low))}
          hint="Bajo el mínimo"
          to="/inventory?stockStatus=low"
          status={low > 0 ? 'low' : 'clear'}
          loading={isLoading}
        />
        <StatCard
          label="Agotados"
          value={figure(String(out))}
          hint="Sin unidades"
          to="/inventory?stockStatus=out"
          status={out > 0 ? 'out' : 'clear'}
          loading={isLoading}
        />
      </div>

      {isError && (
        <p className="mt-4 text-sm text-fg-muted transition-colors">
          No se pudieron cargar las cifras: {(error as Error).message}
        </p>
      )}

      {/* Only once there is stock worth money to break down: an empty catalogue has
          no shape to show, and two empty axes say less than nothing. */}
      {breakdown.data && breakdown.data.totalValue > 0 && (
        <div className="mt-4">
          <Suspense
            fallback={
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="h-64 rounded-lg border border-border bg-surface" />
                <div className="h-64 rounded-lg border border-border bg-surface" />
              </div>
            }
          >
            <InventoryCharts breakdown={breakdown.data} />
          </Suspense>
        </div>
      )}

      {data?.productCount === 0 && (
        <p className="mt-6 text-sm text-fg-muted transition-colors">
          Aún no hay productos.{' '}
          {isAdmin && (
            <Link to="/inventory/new" className="text-fg underline transition-colors">
              Nuevo producto
            </Link>
          )}
        </p>
      )}
    </Page>
  );
}
