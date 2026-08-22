import type { ProductListResponse, StockStatus } from '@ordo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

export type ProductFilters = {
  search?: string;
  stockStatus?: StockStatus;
  category?: string;
  supplier?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

/**
 * The filters as the query string the API understands, skipping what is unset. Shared
 * with the CSV export, which has to ask for exactly what the list is showing.
 */
export function toQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

/**
 * The tenant's products. Filters go straight into the query string the API already
 * understands, and React Query caches per combination. The previous page stays on
 * screen while the next loads, so paging never flashes an empty state.
 */
export function useProducts(filters: ProductFilters) {
  const token = useToken();
  const query = toQuery(filters);

  return useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      apiFetch<ProductListResponse>(`/products${query ? `?${query}` : ''}`, {}, token),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });
}
