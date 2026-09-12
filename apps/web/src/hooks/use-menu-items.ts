'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  updateMenuItem,
  type CreateMenuItemPayload,
  type UpdateMenuItemPayload,
} from '@/services/menu-items.service';
import type { MenuItem, MenuItemStatus } from '@/types/menu';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useVisiblePollInterval } from './use-live-query';

/**
 * The menu hangs off the restaurant, not the branch — a `Menu` row carries
 * `restaurantId` — so the key is scoped by restaurant only. Adding the branch
 * would split one identical answer across every branch and cost the cashier a
 * fresh menu download per branch switch. The restaurant id is not optional:
 * `/menu-items` is resolved from the `x-restaurant-id` header, so without it
 * in the key one restaurant's catalogue would be served to the next.
 */
export const menuItemKeys = {
  all: ['menu-items'] as const,
  list: (restaurantId?: string, categoryId?: string) =>
    [...menuItemKeys.all, 'list', restaurantId ?? null, categoryId ?? null] as const,
  detail: (restaurantId?: string, menuItemId?: string) =>
    [...menuItemKeys.all, 'detail', restaurantId ?? null, menuItemId ?? null] as const,
};

interface UseMenuItemsOptions {
  /** Narrows to one category; omit for the whole restaurant catalogue. */
  categoryId?: string;
  /** Opt-in background refresh; pauses while the tab is hidden. */
  pollMs?: number;
  enabled?: boolean;
}

/**
 * Prices and availability are edited between services, essentially never
 * during one, and the cashier re-reads this list on every order. Five minutes
 * of freshness turns a till session into one download instead of one per
 * screen visit; a menu edit invalidates the cache immediately anyway.
 */
const MENU_STALE_TIME = 5 * 60_000;

/**
 * The shared gcTime is five minutes, which would evict the catalogue at the
 * exact moment it went stale and leave the till downloading it again anyway.
 * Holding it ten gives a screen visit a cached answer to come back to.
 */
const MENU_GC_TIME = 10 * 60_000;

export function useMenuItems({ categoryId, pollMs, enabled = true }: UseMenuItemsOptions = {}) {
  const { currentRestaurant } = useRestaurant();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: menuItemKeys.list(currentRestaurant?.id, categoryId),
    queryFn: async () => {
      const res = await getMenuItems(categoryId);
      return (res.data ?? []) as MenuItem[];
    },
    enabled: enabled && Boolean(currentRestaurant),
    refetchInterval: pollMs ? refetchInterval : false,
    staleTime: MENU_STALE_TIME,
    gcTime: MENU_GC_TIME,

    // The client default is `refetchOnMount: 'always'`, which would re-request
    // on every mount and make the staleTime above meaningless.
    refetchOnMount: true,
  });
}

export function useMenuItem(
  menuItemId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: menuItemKeys.detail(currentRestaurant?.id, menuItemId),
    queryFn: async () => {
      const res = await getMenuItemById(menuItemId!);
      return res.data as MenuItem;
    },
    enabled: enabled && Boolean(menuItemId && currentRestaurant),
    staleTime: MENU_STALE_TIME,
    gcTime: MENU_GC_TIME,
    refetchOnMount: true,
  });
}

function useInvalidateMenuItems() {
  const queryClient = useQueryClient();
  return () => {
    // An item can be moved between categories, so more than one filtered list
    // is affected by a single write.
    void queryClient.invalidateQueries({ queryKey: menuItemKeys.all });
  };
}

export function useCreateMenuItem() {
  const invalidate = useInvalidateMenuItems();

  return useMutation({
    mutationFn: (data: CreateMenuItemPayload) => createMenuItem(data),
    onSuccess: invalidate,
  });
}

export function useUpdateMenuItem() {
  const invalidate = useInvalidateMenuItems();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemPayload }) =>
      updateMenuItem(id, data),
    onSuccess: invalidate,
  });
}

/** Taking an item off the menu mid-service is a status change, not a delete. */
export function useUpdateMenuItemStatus() {
  const invalidate = useInvalidateMenuItems();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MenuItemStatus }) =>
      updateMenuItem(id, { status }),
    onSuccess: invalidate,
  });
}

export function useDeleteMenuItem() {
  const invalidate = useInvalidateMenuItems();

  return useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: invalidate,
  });
}
