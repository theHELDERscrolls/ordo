import type { InventoryBreakdown } from '@ordo/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/**
 * Both panel charts read this one query, so they always agree on the total they are
 * shares of.
 */
export function useInventoryBreakdown() {
  const token = useToken();
  return useQuery({
    queryKey: ['inventory-breakdown'],
    queryFn: () => apiFetch<InventoryBreakdown>('/dashboard/inventory-breakdown', {}, token),
    enabled: Boolean(token),
  });
}
