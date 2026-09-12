'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getDashboardAnalytics,
  getDashboardOverview,
  getPlatformDashboardOverview,
  type PlatformOverviewResponse,
} from '@/services/dashboard.service';
import type { DashboardAnalytics, DashboardOverview } from '@/types/dashboard';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useVisiblePollInterval } from './use-live-query';

/**
 * `/dashboard/*` aggregates whatever the `x-restaurant-id` and `x-branch-id`
 * headers point at, so both ids and the date window are part of the key. Drop
 * either id and an operator switching branches would read the previous
 * branch's takings — a tenant-isolation failure with a number attached to it.
 *
 * The platform key is deliberately restaurant-free: `/dashboard/platform-
 * overview` is the cross-tenant view, and scoping it to a restaurant would
 * imply a tenant boundary the endpoint does not have.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: (restaurantId?: string, branchId?: string, startDate?: string, endDate?: string) =>
    [
      ...dashboardKeys.all,
      'overview',
      restaurantId ?? null,
      branchId ?? null,
      startDate ?? null,
      endDate ?? null,
    ] as const,
  analytics: (restaurantId?: string, branchId?: string, startDate?: string, endDate?: string) =>
    [
      ...dashboardKeys.all,
      'analytics',
      restaurantId ?? null,
      branchId ?? null,
      startDate ?? null,
      endDate ?? null,
    ] as const,
  platformOverview: (startDate?: string, endDate?: string) =>
    [...dashboardKeys.all, 'platform-overview', startDate ?? null, endDate ?? null] as const,
};

interface UseDashboardOptions {
  startDate?: string;
  endDate?: string;
  /**
   * Milliseconds between background refreshes. Left to the caller because a
   * dashboard on a wall display wants it and a dashboard being read at a desk
   * does not; `useVisiblePollInterval` stops the timer while the tab is
   * hidden, so a screen nobody is watching stops asking.
   */
  pollMs?: number;
  enabled?: boolean;
}

export function useDashboardOverview({
  startDate,
  endDate,
  pollMs,
  enabled = true,
}: UseDashboardOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: dashboardKeys.overview(
      currentRestaurant?.id,
      currentBranch?.id,
      startDate,
      endDate,
    ),
    queryFn: async () => {
      const res = await getDashboardOverview(startDate, endDate);
      return res.data as DashboardOverview;
    },
    enabled: enabled && Boolean(currentRestaurant),
    refetchInterval: pollMs ? refetchInterval : false,
    refetchOnMount: true,
  });
}

/**
 * The analytics series is a heavier aggregate than the overview and the
 * dashboard only shows it on one tab, so it is a separate query: the tab can
 * pass `enabled: false` and the request never leaves the browser until
 * someone actually opens it.
 */
export function useDashboardAnalytics({
  startDate,
  endDate,
  pollMs,
  enabled = true,
}: UseDashboardOptions = {}) {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: dashboardKeys.analytics(
      currentRestaurant?.id,
      currentBranch?.id,
      startDate,
      endDate,
    ),
    queryFn: async () => {
      const res = await getDashboardAnalytics(startDate, endDate);
      return res.data as DashboardAnalytics;
    },
    enabled: enabled && Boolean(currentRestaurant),
    refetchInterval: pollMs ? refetchInterval : false,
    refetchOnMount: true,
  });
}

interface UsePlatformDashboardOptions {
  startDate?: string;
  endDate?: string;
  pollMs?: number;
  enabled?: boolean;
}

/** Platform-admin only; the caller is responsible for the role gate. */
export function usePlatformDashboardOverview({
  startDate,
  endDate,
  pollMs,
  enabled = true,
}: UsePlatformDashboardOptions = {}) {
  const refetchInterval = useVisiblePollInterval(pollMs ?? 0);

  return useQuery({
    queryKey: dashboardKeys.platformOverview(startDate, endDate),
    queryFn: async () => {
      const res = await getPlatformDashboardOverview(startDate, endDate);
      return res.data as PlatformOverviewResponse['data'];
    },
    enabled,
    refetchInterval: pollMs ? refetchInterval : false,
    refetchOnMount: true,
  });
}
