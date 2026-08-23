import type { ProductFacets } from '@ordo/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/core/api/api';
import { useToken } from '@/core/auth/use-token';

/** The distinct categories and suppliers, to fill the filters independently of the page. */
export function useFacets() {
  const token = useToken();
  return useQuery({
    queryKey: ['product-facets'],
    queryFn: () => apiFetch<ProductFacets>('/products/facets', {}, token),
    enabled: Boolean(token),
  });
}
