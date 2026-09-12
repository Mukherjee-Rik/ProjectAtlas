'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch,
  type CreateBranchPayload,
  type UpdateBranchPayload,
} from '@/services/branches.service';
import type { Branch } from '@/types/branch';
import { useRestaurant } from '@/hooks/use-restaurant';

/**
 * Branches belong to a restaurant, so the restaurant id is the whole of the
 * scope — there is no branch context above a branch list. It is in the key
 * even though it is also in the query string, because `/branches` with no
 * `restaurantId` falls back to the `x-restaurant-id` header and would
 * otherwise share a cache entry across restaurants.
 */
export const branchKeys = {
  all: ['branches'] as const,
  list: (restaurantId?: string) => [...branchKeys.all, 'list', restaurantId ?? null] as const,
  detail: (restaurantId?: string, branchId?: string) =>
    [...branchKeys.all, 'detail', restaurantId ?? null, branchId ?? null] as const,
};

interface UseBranchesOptions {
  /** Defaults to the active restaurant; pass one to read another explicitly. */
  restaurantId?: string;
  enabled?: boolean;
}

export function useBranches({ restaurantId, enabled = true }: UseBranchesOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const scopedRestaurantId = restaurantId ?? currentRestaurant?.id;

  return useQuery({
    queryKey: branchKeys.list(scopedRestaurantId),
    queryFn: async () => {
      const res = await getBranches(scopedRestaurantId);
      return (res.data ?? []) as Branch[];
    },
    enabled: enabled && Boolean(scopedRestaurantId),

    // A restaurant does not open a branch during a shift, and this list is
    // read as a lookup by the forecast and reporting screens.
    staleTime: 5 * 60_000,

    // Outliving the shared five-minute gcTime: otherwise the entry is evicted
    // at the same moment it goes stale and the staleTime buys nothing.
    gcTime: 10 * 60_000,

    // Without this the client default (`refetchOnMount: 'always'`) re-requests
    // on every mount and the staleTime above never takes effect.
    refetchOnMount: true,
  });
}

/**
 * One branch by id. Named `useBranchDetail` rather than `useBranch` because
 * that name belongs to the branch-context hook every page already imports —
 * a page needs to be able to hold both.
 */
export function useBranchDetail(
  branchId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: branchKeys.detail(currentRestaurant?.id, branchId),
    queryFn: async () => {
      const res = await getBranchById(branchId!);
      return res.data as Branch;
    },
    enabled: enabled && Boolean(branchId && currentRestaurant),
    refetchOnMount: true,
  });
}

/**
 * Branch writes invalidate this cache, but the branch *switcher* keeps its own
 * copy in `BranchProvider`. A page that creates, renames or deletes a branch
 * must also call `reloadBranches()` from `useBranch()`, or the switcher keeps
 * showing the old list until the next restaurant change.
 */
function useInvalidateBranches() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: branchKeys.all });
  };
}

export function useCreateBranch() {
  const invalidate = useInvalidateBranches();

  return useMutation({
    mutationFn: (data: CreateBranchPayload) => createBranch(data),
    onSuccess: invalidate,
  });
}

export function useUpdateBranch() {
  const invalidate = useInvalidateBranches();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchPayload }) => updateBranch(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteBranch() {
  const invalidate = useInvalidateBranches();

  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: invalidate,
  });
}
