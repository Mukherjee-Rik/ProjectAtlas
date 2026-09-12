'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDiningArea,
  deleteDiningArea,
  getDiningAreaById,
  getDiningAreas,
  updateDiningArea,
  type CreateDiningAreaPayload,
  type UpdateDiningAreaPayload,
} from '@/services/dining-areas.service';
import type { DiningArea } from '@/types/dining-area';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useVisiblePollInterval } from './use-live-query';

/**
 * A dining area belongs to a branch, and `/dining-areas` resolves that branch
 * from the `x-branch-id` header rather than the URL. Both scoping ids are part
 * of the key so a branch switch cannot serve the previous branch's floor plan.
 */
export const diningAreaKeys = {
  all: ['dining-areas'] as const,
  list: (restaurantId?: string, branchId?: string) =>
    [...diningAreaKeys.all, 'list', restaurantId ?? null, branchId ?? null] as const,
  detail: (restaurantId?: string, branchId?: string, diningAreaId?: string) =>
    [
      ...diningAreaKeys.all,
      'detail',
      restaurantId ?? null,
      branchId ?? null,
      diningAreaId ?? null,
    ] as const,
};

interface UseDiningAreasOptions {
  /** Opt-in background refresh; pauses while the tab is hidden. */
  pollMs?: number;
  enabled?: boolean;
}

export function useDiningAreas({ pollMs, enabled = true }: UseDiningAreasOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: diningAreaKeys.list(currentRestaurant?.id, currentBranch?.id),
    queryFn: async () => {
      const res = await getDiningAreas();
      return (res.data ?? []) as DiningArea[];
    },
    enabled: enabled && Boolean(currentRestaurant && currentBranch),
    refetchInterval: pollMs ? refetchInterval : false,

    // A floor plan is rearranged between services, not during one. The pages
    // that read it — tables, waiter, table-qrs — mostly want it as a lookup
    // for names, so re-requesting it on every navigation buys nothing.
    staleTime: 5 * 60_000,

    // Outliving the shared five-minute gcTime: otherwise the entry is evicted
    // at the same moment it goes stale and the staleTime buys nothing.
    gcTime: 10 * 60_000,

    // Without this the client default (`refetchOnMount: 'always'`) would
    // re-request on every mount and the staleTime above would never apply.
    refetchOnMount: true,
  });
}

export function useDiningArea(
  diningAreaId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: diningAreaKeys.detail(currentRestaurant?.id, currentBranch?.id, diningAreaId),
    queryFn: async () => {
      const res = await getDiningAreaById(diningAreaId!);
      return res.data as DiningArea;
    },
    enabled: enabled && Boolean(diningAreaId && currentRestaurant && currentBranch),
    refetchOnMount: true,
  });
}

function useInvalidateDiningAreas() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: diningAreaKeys.all });
  };
}

export function useCreateDiningArea() {
  const invalidate = useInvalidateDiningAreas();

  return useMutation({
    mutationFn: (data: CreateDiningAreaPayload) => createDiningArea(data),
    onSuccess: invalidate,
  });
}

export function useUpdateDiningArea() {
  const invalidate = useInvalidateDiningAreas();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiningAreaPayload }) =>
      updateDiningArea(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteDiningArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDiningArea(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: diningAreaKeys.all });
      // Deleting an area takes its tables with it, so the table lists that
      // still hold them are stale. Referencing the key literally rather than
      // importing `tableKeys` keeps this module free of a cycle — use-tables
      // already imports from here.
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
