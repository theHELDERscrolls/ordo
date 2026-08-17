import type { CreateProductInput, Product, UpdateProductInput } from '@ordo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/** One product, for the edit form. Idle in create mode, where there is no id. */
export function useProduct(id: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiFetch<Product>(`/products/${id}`, {}, token),
    enabled: Boolean(id && token),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product-facets'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['inventory-breakdown'] });
    },
  });
}
