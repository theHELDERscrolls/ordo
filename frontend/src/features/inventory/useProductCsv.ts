import type { ImportMode, ImportResult } from '@ordo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toQuery, type ProductFilters } from './useProducts';
import { apiDownload, apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/**
 * Downloads the inventory as a spreadsheet. The filters are the ones on screen and the
 * pagination is dropped: what you export is what you are looking at, not the page you
 * happen to be on.
 *
 * A mutation rather than a query, because it is an action with no cached result: it
 * only lends the button its pending and error state.
 */
export function useExportProducts() {
  const token = useToken();
  return useMutation({
    mutationFn: (filters: ProductFilters) =>
      apiDownload(
        `/products/export.csv?${toQuery({ ...filters, page: undefined, limit: undefined })}`,
        'ordo-inventario.csv',
        token,
      ),
  });
}

export type ImportInput = { text: string; mode: ImportMode; dryRun: boolean };

/**
 * Runs a CSV against the catalogue. One mutation covers both steps, because they are
 * the same request: `dryRun` reports what would happen and writes nothing, and the
 * result carries the flag back, so the dialog knows which of the two it is showing.
 *
 * Only a real run invalidates, and it invalidates more than a movement does: an import
 * can create products and with them a category or a supplier that the filters have to
 * offer at once, and it leaves movements behind for the stock it changed.
 */
export function useImportProducts() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, mode, dryRun }: ImportInput) =>
      apiFetch<ImportResult>(
        `/products/import?dryRun=${dryRun}&quantityMode=${mode}`,
        { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: text },
        token,
      ),
    onSuccess: (result) => {
      if (result.dryRun) return;
      void qc.invalidateQueries({ queryKey: ['products'] });
      // Every product sheet at once: an import touches many, and the key's prefix
      // match is what saves listing which.
      void qc.invalidateQueries({ queryKey: ['product'] });
      void qc.invalidateQueries({ queryKey: ['product-facets'] });
      void qc.invalidateQueries({ queryKey: ['movements'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['inventory-breakdown'] });
    },
  });
}
