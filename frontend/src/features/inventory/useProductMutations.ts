import type {
  CreateProductInput,
  Product,
  ProductListResponse,
  UpdateProductInput,
} from '@ordo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/**
 * One product, for the detail sheet and the edit form. Idle in create mode, where
 * there is no id.
 *
 * Seeded from whatever list page is already cached, so a product the list is already
 * showing is available without waiting for a round trip. The request still runs, in
 * the background, to pick up anything that changed.
 */
export function useProduct(id: string | undefined) {
  const token = useToken();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiFetch<Product>(`/products/${id}`, {}, token),
    enabled: Boolean(id && token),
    initialData: () =>
      qc
        .getQueriesData<ProductListResponse>({ queryKey: ['products'] })
        .flatMap(([, data]) => data?.items ?? [])
        .find((p) => p.id === id),
    initialDataUpdatedAt: 0,
  });
}

/**
 * Creates or updates depending on whether an id is present, then invalidates
 * everything the write can have changed: the list, the product, the facets (a new
 * category has to appear in the filters at once) and the panel's figures.
 */
export function useSaveProduct(id: string | undefined) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput | UpdateProductInput) =>
      apiFetch<Product>(
        id ? `/products/${id}` : '/products',
        { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) },
        token,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product', id] });
      void qc.invalidateQueries({ queryKey: ['product-facets'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['inventory-breakdown'] });
    },
  });
}

/** Removes a product, invalidating the same views as a save. */
export function useDeleteProduct() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/products/${id}`, { method: 'DELETE' }, token),
    onSuccess: (_data, id) => {
      // Dropped rather than invalidated: the product is gone, and a stale copy would
      // still fill the edit form for anyone reaching its URL from history.
      qc.removeQueries({ queryKey: ['product', id] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product-facets'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['inventory-breakdown'] });
    },
  });
}
