import type { DashboardStats } from '@ordo/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/**
 * The snapshot behind the panel's cards. The API aggregates it, so the client never
 * loads the catalogue just to count it.
 */
export function useDashboardStats() {
  const token = useToken();
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiFetch<DashboardStats>('/dashboard/stats', {}, token),
    enabled: Boolean(token),
  });
}
