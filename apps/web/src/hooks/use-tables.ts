'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTable,
  deleteTable,
  getTableById,
  getTableQr,
  getTables,
  regenerateTableQr,
  updateTable,
  type CreateTablePayload,
  type TableQrResponse,
  type UpdateTablePayload,
} from '@/services/tables.service';
import type { RestaurantTable, TableStatus } from '@/types/table';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useVisiblePollInterval } from './use-live-query';
import { diningAreaKeys } from './use-dining-areas';

/**
 * `/tables` carries no restaurant or branch in its path — `apiClient` supplies
 * both as `x-restaurant-id` / `x-branch-id` headers taken from the active
 * context. Two different branches therefore hit the same URL and return
 * different rows, so the scoping ids have to live in the query key instead. A
 * key of just `['tables']` would hand the previous branch's tables to the next
 * one after a switch: a tenant-isolation failure, not a staleness bug.
 */
export const tableKeys = {
  all: ['tables'] as const,
  list: (restaurantId?: string, branchId?: string, diningAreaId?: string) =>
    [
      ...tableKeys.all,
      'list',
      restaurantId ?? null,
      branchId ?? null,
      diningAreaId ?? null,
    ] as const,
  detail: (restaurantId?: string, branchId?: string, tableId?: string) =>
    [...tableKeys.all, 'detail', restaurantId ?? null, branchId ?? null, tableId ?? null] as const,
  qr: (restaurantId?: string, branchId?: string, tableId?: string, baseUrl?: string) =>
    [
      ...tableKeys.all,
      'qr',
      restaurantId ?? null,
      branchId ?? null,
      tableId ?? null,
      baseUrl ?? null,
    ] as const,
};

interface UseTablesOptions {
  /** Narrows to one dining area; omit for every table in the active branch. */
  diningAreaId?: string;
  /**
   * Milliseconds between background refreshes. Polling is opt-in per page
   * rather than baked in here: the floor screens (cashier, waiter) want it,
   * the settings-style screens (tables, table-qrs, dining-areas) do not. The
   * interval is routed through `useVisiblePollInterval`, so a tablet left open
   * on the pass all day stops requesting the moment nobody is looking at the
   * tab and resumes on return.
   */
  pollMs?: number;
  enabled?: boolean;
}

export function useTables({ diningAreaId, pollMs, enabled = true }: UseTablesOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: tableKeys.list(currentRestaurant?.id, currentBranch?.id, diningAreaId),
    queryFn: async () => {
      const res = await getTables(diningAreaId);
      return (res.data ?? []) as RestaurantTable[];
    },
    // Never run before the branch is known: the request would go out without
    // an `x-branch-id` header and the answer would be cached under a null key.
    enabled: enabled && Boolean(currentRestaurant && currentBranch),
    refetchInterval: pollMs ? refetchInterval : false,

    // The client default is `refetchOnMount: 'always'`, which re-requests on
    // every mount and so cancels out the shared 30s staleTime — the whole
    // point of the migration is that walking back to a screen costs nothing.
    refetchOnMount: true,
  });
}

export function useTable(tableId: string | undefined, { enabled = true }: { enabled?: boolean } = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: tableKeys.detail(currentRestaurant?.id, currentBranch?.id, tableId),
    queryFn: async () => {
      const res = await getTableById(tableId!);
      return res.data as RestaurantTable;
    },
    enabled: enabled && Boolean(tableId && currentRestaurant && currentBranch),
    refetchOnMount: true,
  });
}

/**
 * One table's QR payload. `table-qrs` asks for every table's QR at once, so
 * these are cached per table: re-opening the page, or printing a second sheet,
 * reuses the SVGs instead of regenerating the whole grid.
 */
export function useTableQr(
  tableId: string | undefined,
  baseUrl?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: tableKeys.qr(currentRestaurant?.id, currentBranch?.id, tableId, baseUrl),
    queryFn: async () => {
      const res = await getTableQr(tableId!, baseUrl);
      return res.data as TableQrResponse['data'];
    },
    enabled: enabled && Boolean(tableId && currentRestaurant && currentBranch),
    // A table's QR only changes when someone regenerates it, which invalidates
    // this key explicitly below. gcTime is raised past the shared five minutes
    // so the entry is not evicted at the moment it goes stale.
    staleTime: 10 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: true,
  });
}

/**
 * Table writes also move the `_count.tables` that dining areas report, so both
 * caches are dropped together. Invalidating the whole `tables` subtree rather
 * than one list is deliberate: a table can move between dining areas, which
 * changes two filtered lists at once.
 */
function useInvalidateTables() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    void queryClient.invalidateQueries({ queryKey: diningAreaKeys.all });
  };
}

export function useCreateTable() {
  const invalidate = useInvalidateTables();

  return useMutation({
    mutationFn: (data: CreateTablePayload) => createTable(data),
    onSuccess: invalidate,
  });
}

export function useUpdateTable() {
  const invalidate = useInvalidateTables();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTablePayload }) => updateTable(id, data),
    onSuccess: invalidate,
  });
}

/**
 * A status flip is an ordinary PATCH; it gets its own mutation only so the
 * floor screens can express the intent without assembling a payload.
 */
export function useUpdateTableStatus() {
  const invalidate = useInvalidateTables();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => updateTable(id, { status }),
    onSuccess: invalidate,
  });
}

export function useDeleteTable() {
  const invalidate = useInvalidateTables();

  return useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: invalidate,
  });
}

export function useRegenerateTableQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, baseUrl }: { id: string; baseUrl?: string }) => regenerateTableQr(id, baseUrl),
    onSuccess: () => {
      // The token changed, so every cached QR for that table — and the table
      // rows that carry `publicToken` — are now wrong.
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}
