'use client';

import { useQuery } from '@tanstack/react-query';

import { getPlans, type Plan } from '@/services/subscriptions.service';

/**
 * `/plans` is the platform's price list, not tenant data: every restaurant
 * sees the same rows and the endpoint ignores the restaurant header. That is
 * why this is the one key in the set with no restaurant id — scoping it would
 * imply a tenant boundary the endpoint does not have, and would make each
 * restaurant download the same catalogue again.
 */
export const planKeys = {
  all: ['plans'] as const,
  list: () => [...planKeys.all, 'list'] as const,
};

interface UsePlansOptions {
  enabled?: boolean;
}

export function usePlans({ enabled = true }: UsePlansOptions = {}) {
  return useQuery({
    queryKey: planKeys.list(),
    queryFn: async () => {
      const res = await getPlans();
      return (res.data ?? []) as Plan[];
    },
    enabled,

    // Plans change when the business changes its pricing — a handful of times
    // a year. Both subscription views ask for this list, and the upgrade flow
    // walks between them; half an hour of freshness makes that walk free.
    staleTime: 30 * 60_000,

    // The shared gcTime is five minutes, so without this the entry would be
    // evicted long before it went stale and the long staleTime above would
    // only ever apply while something was still mounted.
    gcTime: 30 * 60_000,

    // The client default is `refetchOnMount: 'always'`, which would re-request
    // on every mount and undo the staleTime above.
    refetchOnMount: true,
  });
}
