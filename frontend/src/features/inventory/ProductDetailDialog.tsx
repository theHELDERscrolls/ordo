import { Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useDeleteProduct, useProduct } from './useProductMutations';
import { useAuth } from '@/core/auth/use-auth';
import { money } from '@/shared/format';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Modal } from '@/shared/ui/Modal';
import { StockBadge } from '@/shared/ui/StockBadge';
import { buttonClasses } from '@/shared/ui/button-styles';

/** One field of the sheet. An empty optional field drops its row instead of printing a dash. */
function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="text-sm tabular-nums">{value}</dd>
    </div>
  );
}

type ProductDetailDialogProps = {
  /** The product to show, or `null` when the sheet is closed. */
  productId: string | null;
  onClose: () => void;
};

/**
 * The product's read-only sheet: what a row opens, for any role. Editing and
 * deleting hang off it as a deliberate second step, and only for `admin`.
 *
 * The sheet opens on the product, not before it: while the fetch is in flight there
 * is nothing to show, so nothing is shown. Reading through `useProduct` also leaves
 * the product cached under its own key, so the edit form it hands over to opens
 * filled in, and a link straight to `?product=<id>` works even when the product is
 * not on the current page.
 */
export function ProductDetailDialog({ productId, onClose }: ProductDetailDialogProps) {
  const auth = useAuth();
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'admin';

  const { data: product, isError } = useProduct(productId ?? undefined);
  const remove = useDeleteProduct();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // A link to a product that was deleted, belongs to another business or is simply
  // malformed has nothing to open: drop the parameter rather than leave it dangling
  // over an inventory that looks untouched.
  useEffect(() => {
    if (isError) onClose();
    // Keyed on the failure alone: `onClose` is rebuilt on every render of the page
    // above, and including it would re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  return (
    <>
      <Modal
        open={Boolean(productId && product)}
        onClose={onClose}
        labelledBy="product-dialog-title"
      >
        {product && (
          <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="product-dialog-title"
                className="font-display text-xl font-semibold tracking-tight"
              >
                {product.name}
              </h2>
              <p className="mt-0.5 text-sm tabular-nums text-fg-muted">{product.sku}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 -mt-1 shrink-0 rounded-md p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt=""
              className="mt-5 aspect-[4/3] w-full rounded-md border border-border object-cover"
            />
          )}

          <div className="mt-5 flex items-end justify-between gap-4 border-y border-border py-4">
            <p className="font-display text-3xl font-bold leading-none tabular-nums">
              {product.stock}
              <span className="ml-1.5 text-base font-medium text-fg-muted">{product.unit}</span>
            </p>
            <StockBadge status={product.stockStatus} />
          </div>

          <dl className="divide-y divide-border">
            <Row label="Precio de venta" value={money(product.salePrice)} />
            <Row label="Precio de coste" value={money(product.costPrice)} />
            <Row label="Stock mínimo" value={String(product.minStock)} />
            <Row label="Categoría" value={product.category} />
            <Row label="Proveedor" value={product.supplier} />
          </dl>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed text-fg-muted">{product.description}</p>
          )}

          {isAdmin && (
            <>
              {remove.isError && (
                <p className="mt-5 text-sm text-red-600 dark:text-red-400">
                  No se pudo eliminar: {(remove.error as Error).message}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md py-2 text-sm text-fg-muted transition-colors hover:text-red-600"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                  Eliminar
                </button>
                <Link to={`/inventory/${product.id}/edit`} className={buttonClasses('primary')}>
                  <Pencil size={16} strokeWidth={1.75} />
                  Editar
                </Link>
              </div>
            </>
          )}

        </>
      )}
      </Modal>

      {/* A sibling of the sheet, not a child: a nested `<dialog>` under an ancestor
          carrying a transform or a backdrop filter can be positioned against that
          ancestor instead of the viewport, which would drop the confirmation inside
          the scrollable panel. */}
      {product && (
        <ConfirmDialog
          open={confirmOpen}
          title="Eliminar producto"
          message="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          busy={remove.isPending}
          // The confirmation stays up until the request answers, so a failure lands
          // back on the sheet with its reason rather than vanishing unremarked.
          onConfirm={() =>
            remove.mutate(product.id, {
              onSuccess: () => {
                setConfirmOpen(false);
                onClose();
              },
              onError: () => setConfirmOpen(false),
            })
          }
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
