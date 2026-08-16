'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getOrders, updateOrderStatus } from '@/services/orders.service';
import type { Order, OrderStatus } from '@/types/order';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useVisiblePollInterval } from './use-live-query';

/**
 * Query keys include the active restaurant and branch. Without them, switching
 * restaurants would serve the previous restaurant's cached orders — a
 * multi-tenant data-leak class of bug, not just a staleness one.
 */
export const orderKeys = {
  all: ['orders'] as const,
  list: (restaurantId?: string, branchId?: string, status?: OrderStatus | 'ALL') =>
    [...orderKeys.all, 'list', restaurantId ?? null, branchId ?? null, status ?? 'ALL'] as const,
};

interface UseOrdersOptions {
  status?: OrderStatus | 'ALL';
  /** Milliseconds between background refreshes; pauses while the tab is hidden. */
  pollMs?: number;
  enabled?: boolean;
}

export function useOrders({ status = 'ALL', pollMs, enabled = true }: UseOrdersOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  const query = useQuery({
    queryKey: orderKeys.list(currentRestaurant?.id, currentBranch?.id, status),
    queryFn: async () => {
      const res = await getOrders(status === 'ALL' ? undefined : status);
      return (res.data ?? []) as Order[];
    },
    enabled: enabled && Boolean(currentRestaurant),
    refetchInterval: pollMs ? refetchInterval : false,
  });

  return query;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Every order list is now stale regardless of its filter.
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
