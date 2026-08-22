import type { CreateMovementInput, Movement } from '@ordo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/**
 * Records an entry or an exit. A movement changes the product's stock, so it
 * invalidates everything that reads that number — the ledger itself, the inventory
 * list, the product's own sheet and the panel's figures — which is what makes the
 * inventory and the dashboard update without a reload.
 *
 * The facets are left alone: a movement never introduces a category or a supplier.
 */
export function useCreateMovement() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMovementInput) =>
      apiFetch<Movement>('/movements', { method: 'POST', body: JSON.stringify(input) }, token),
    onSuccess: (movement) => {
      void qc.invalidateQueries({ queryKey: ['movements'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product', movement.productId] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['inventory-breakdown'] });
    },
  });
}
