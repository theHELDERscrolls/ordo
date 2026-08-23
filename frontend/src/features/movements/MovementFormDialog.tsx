import { useState, type FormEvent } from 'react';

import { MovementBadge } from './MovementBadge';
import { ProductPicker } from './ProductPicker';
import { useCreateMovement } from './useCreateMovement';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { TextField } from '@/shared/ui/TextField';
import { buttonClasses } from '@/shared/ui/button-styles';

/**
 * The two refusals the API can answer with, in the language the rest of the app
 * speaks. Anything else is shown as it arrives rather than guessed at.
 */
const messages: Record<string, string> = {
  'Insufficient stock': 'No hay stock suficiente para registrar esa salida.',
  'Product not found': 'Ese producto ya no está en tu catálogo.',
};

type MovementFormDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Preselects a product, when the dialog is opened from somewhere that has one. */
  productId?: string;
};

/**
 * Records an entry or an exit, for any role. `adjust` is not offered: a correction
 * is something the system writes when the stock changes through another path, never
 * a plain entry a client can declare.
 *
 * The fields are plain state rather than a form library: there are four of them, and
 * the only rule worth checking here is that a product and a positive quantity are
 * present. The real validation is the API's, including the stock guard behind an
 * exit, which no client-side check could stand in for.
 */
export function MovementFormDialog({ open, onClose, productId = '' }: MovementFormDialogProps) {
  const [product, setProduct] = useState(productId);
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const create = useCreateMovement();
  const amount = Number(quantity);
  const canSubmit = Boolean(product) && amount > 0 && !create.isPending;

  function close() {
    setProduct(productId);
    setType('in');
    setQuantity('');
    setReason('');
    create.reset();
    onClose();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      { productId: product, type, quantity: amount, reason: reason.trim() || undefined },
      { onSuccess: close },
    );
  }

  const error = create.error as Error | null;

  return (
    <Modal open={open} onClose={close} labelledBy="movement-dialog-title">
      <h2 id="movement-dialog-title" className="font-display text-xl font-semibold tracking-tight">
        Registrar movimiento
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Queda en el historial y ajusta el stock del producto.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <ProductPicker label="Producto" value={product} onChange={setProduct} />

        <fieldset>
          <legend className="text-sm font-medium">Tipo</legend>
          <div className="mt-1.5 flex gap-2">
            {(['in', 'out'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                aria-pressed={type === option}
                className={`rounded-md border px-3 py-2 transition-colors ${
                  type === option ? 'border-fg bg-surface-2' : 'border-border hover:border-fg'
                }`}
              >
                <MovementBadge type={option} />
              </button>
            ))}
          </div>
        </fieldset>

        <TextField
          label="Cantidad"
          id="movement-quantity"
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <TextField
          label="Motivo (opcional)"
          id="movement-reason"
          maxLength={120}
          placeholder="Recuento, rotura, pedido a proveedor…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {messages[error.message] ?? error.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={close} className={buttonClasses('secondary')}>
            Cancelar
          </button>
          <Button type="submit" disabled={!canSubmit}>
            {create.isPending ? 'Registrando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
