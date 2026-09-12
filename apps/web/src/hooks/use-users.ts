'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UsersMeta,
  type UsersQuery,
} from '@/services/users.service';
import type { User } from '@/types/user';
import { useRestaurant } from '@/hooks/use-restaurant';

/**
 * `/users` returns the staff of whichever restaurant the `x-restaurant-id`
 * header names, so the restaurant id belongs in the key — without it, an owner
 * switching restaurants would be shown the other restaurant's staff list,
 * including names and email addresses. The filter and page are in the key too
 * because each combination is a different answer from the same URL.
 */
export const userKeys = {
  all: ['users'] as const,
  list: (restaurantId: string | undefined, query: UsersQuery) =>
    [
      ...userKeys.all,
      'list',
      restaurantId ?? null,
      query.search ?? null,
      query.role ?? null,
      query.status ?? null,
      query.page ?? null,
      query.limit ?? null,
    ] as const,
  detail: (restaurantId?: string, userId?: string) =>
    [...userKeys.all, 'detail', restaurantId ?? null, userId ?? null] as const,
};

export interface UsersPage {
  users: User[];
  meta: UsersMeta;
}

interface UseUsersOptions extends UsersQuery {
  enabled?: boolean;
}

export function useUsers({ enabled = true, ...query }: UseUsersOptions = {}) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: userKeys.list(currentRestaurant?.id, query),
    queryFn: async (): Promise<UsersPage> => {
      const res = await getUsers(query);
      const users = (res.data ?? []) as User[];

      // Some deployments answer with `meta` alongside `data`, others nest it
      // inside it. Both shapes have been in production, so both are read here
      // rather than in each page — and a response with neither still yields a
      // usable single page instead of breaking pagination.
      const meta: UsersMeta =
        (res as { meta?: UsersMeta }).meta ??
        (res.data as unknown as { meta?: UsersMeta } | undefined)?.meta ?? {
          page: query.page ?? 1,
          limit: query.limit ?? users.length,
          total: users.length,
          totalPages: 1,
        };

      return { users, meta };
    },
    enabled: enabled && Boolean(currentRestaurant),

    // Keeps the previous page on screen while the next one loads, so paging
    // and typing in the search box do not blank the table on every keystroke.
    placeholderData: (previous) => previous,
    refetchOnMount: true,
  });
}

export function useUser(userId: string | undefined, { enabled = true }: { enabled?: boolean } = {}) {
  const { currentRestaurant } = useRestaurant();

  return useQuery({
    queryKey: userKeys.detail(currentRestaurant?.id, userId),
    queryFn: async () => {
      const res = await getUserById(userId!);
      return res.data as User;
    },
    enabled: enabled && Boolean(userId && currentRestaurant),
    refetchOnMount: true,
  });
}

/**
 * Any write can move a row between filters and pages, so the whole `users`
 * subtree goes rather than the one list that happens to be on screen.
 */
function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: userKeys.all });
  };
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) => updateUser(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: invalidate,
  });
}
