import type { MovementListResponse, MovementType } from '@ordo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

export type MovementFilters = {
  productId?: string;
  type?: MovementType;
  /** Inclusive date bounds as `YYYY-MM-DD`; the API stretches `to` to the end of its day. */
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

/**
 * The tenant's ledger, newest first. Filters go straight into the query string the
 * API already understands, and React Query caches per combination. The previous
 * page stays on screen while the next loads, so paging never flashes an empty state.
 */
export function useMovements(filters: MovementFilters) {
  const token = useToken();

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();

  return useQuery({
    queryKey: ['movements', filters],
    queryFn: () =>
      apiFetch<MovementListResponse>(`/movements${query ? `?${query}` : ''}`, {}, token),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });
}
