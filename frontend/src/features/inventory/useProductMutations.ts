import type { CreateProductInput, Product, UpdateProductInput } from '@ordo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

// Fetch one product for the edit form. Disabled when there is no id (create mode).
export function useProduct(id: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiFetch<Product>(`/products/${id}`, {}, token),
    enabled: Boolean(id && token),
  });
}

// Create (POST) or update (PATCH) depending on whether an id is present. Invalidates
// the list, the edited product, and the facets (a new category/supplier must show up
// in the filters right away).
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
    },
  });
}

export function useDeleteProduct() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/products/${id}`, { method: 'DELETE' }, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product-facets'] });
    },
  });
}
