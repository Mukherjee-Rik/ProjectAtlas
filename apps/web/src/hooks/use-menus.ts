'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMenu,
  deleteMenu,
  getMenuById,
  getMenus,
  updateMenu,
  type CreateMenuPayload,
  type UpdateMenuPayload,
} from '@/services/menus.service';
import type { Menu, MenuStatus } from '@/types/menu';
import { useRestaurant } from '@/hooks/use-restaurant';

/**
 * A `Menu` carries `restaurantId`, and `/menus` resolves the restaurant from
 * the `x-restaurant-id` header rather than the path — so the restaurant id is
 * what keeps one restaurant's menus out of another's cache after a switch.
 * There is no branch in the key: menus are shared across a restaurant's
 * branches, and splitting them per branch would re-download the same rows.
 */
export const menuKeys = {
  all: ['menus'] as const,
  list: (restaurantId?: string) => [...menuKeys.all, 'list', restaurantId ?? null] as const,
  detail: (restaurantId?: string, menuId?: string) =>
    [...menuKeys.all, 'detail', restaurantId ?? null, menuId ?? null] as const,
};

interface UseMenusOptions {
  enabled?: boolean;
}

export function useMenus({ enabled = true }: UseMenusOptions = {}) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: menuKeys.list(currentRestaurant?.id),
    queryFn: async () => {
      const res = await getMenus();
      return (res.data ?? []) as Menu[];
    },
    enabled: enabled && Boolean(currentRestaurant),

    // Without this the client default (`refetchOnMount: 'always'`) re-requests
    // on every mount, which is exactly the round trip the migration removes.
    refetchOnMount: true,
  });
}

/**
 * One menu with its categories. The detail pages read this straight after the
 * list has loaded, so it is a separate key rather than a lookup in the list:
 * `/menus/:id` returns the nested categories the list rows do not carry.
 */
export function useMenu(menuId: string | undefined, { enabled = true }: { enabled?: boolean } = {}) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: menuKeys.detail(currentRestaurant?.id, menuId),
    queryFn: async () => {
      const res = await getMenuById(menuId!);
      return res.data as Menu;
    },
    enabled: enabled && Boolean(menuId && currentRestaurant),
    refetchOnMount: true,
  });
}

function useInvalidateMenus() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: menuKeys.all });
  };
}

export function useCreateMenu() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: (data: CreateMenuPayload) => createMenu(data),
    onSuccess: invalidate,
  });
}

export function useUpdateMenu() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuPayload }) => updateMenu(id, data),
    onSuccess: invalidate,
  });
}

/** Publishing or retiring a menu is a status change on the same endpoint. */
export function useUpdateMenuStatus() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MenuStatus }) => updateMenu(id, { status }),
    onSuccess: invalidate,
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMenu(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuKeys.all });
      // Deleting a menu takes its categories and their items with it, so the
      // item lists that still hold them are stale.
      void queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}
