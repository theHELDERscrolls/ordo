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

// Lists products for the current tenant. The filters go straight into the query
// string the API already understands; React Query caches per filter combination.
// keepPreviousData keeps the current page visible while the next one loads, so
// paging doesn't flash an empty/loading state.
export function useProducts(filters: ProductFilters) {
  const token = useToken();

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      apiFetch<ProductListResponse>(`/products${query ? `?${query}` : ''}`, {}, token),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });
}
