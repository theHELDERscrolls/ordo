import type { ProductListResponse, StockStatus } from '@ordo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch, toQuery } from '@/core/api/api';
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
