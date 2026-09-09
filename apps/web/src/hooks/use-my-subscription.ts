'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { Subscription } from '@/services/subscriptions.service';
import { useAuth } from './use-auth';
import { useRestaurant } from './use-restaurant';

/**
 * The current restaurant's subscription.
 *
 * Two components need this on every protected page — SubscriptionGate, which
 * decides whether the app opens at all, and AppShell, which decides whether
 * Ask AI appears. Each used to fetch it from its own effect into its own
 * state, so a page load paid for the same authenticated request twice and
 * every client-side navigation paid for it again. Going through react-query
 * means one request serves both callers and the answer survives a navigation.
 */

export const MY_SUBSCRIPTION_QUERY_KEY = 'my-subscription';

/** Shared so a caller that changes the plan can invalidate what the gate holds. */
export function mySubscriptionQueryKey(restaurantId: string | null) {
  return [MY_SUBSCRIPTION_QUERY_KEY, restaurantId] as const;
}

/**
 * The single definition of "this restaurant may use the app". A trial counts
 * while it is still running; an expired trial, a lapsed plan, or no
 * subscription row at all does not.
 */
export function hasLiveEntitlement(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'ACTIVE') return true;
  return (
    sub.status === 'TRIALING' &&
    (!sub.trialEnd || new Date(sub.trialEnd).getTime() > Date.now())
  );
}

export interface MySubscriptionResult {
  subscription: Subscription | null;
  /**
   * True only while the first answer for this restaurant is still in flight.
   * Revalidating an answer we already hold leaves this false, so a caller can
   * keep showing what it has instead of flashing a placeholder.
   */
  isFirstLoad: boolean;
  /** The request failed. Callers that gate on entitlement must fail closed. */
  isError: boolean;
  isFetching: boolean;
}

export function useMySubscription(): MySubscriptionResult {
  const { user } = useAuth();
  const { currentRestaurantId } = useRestaurant();

  // Platform staff administer the platform itself and are not billable, and a
  // session with no restaurant selected has nothing to ask about — neither has
  // a subscription to fetch.
  const isBillableContext =
    Boolean(currentRestaurantId) && Boolean(user) && user?.role !== 'PLATFORM_ADMIN';

  const query = useQuery({
    queryKey: mySubscriptionQueryKey(currentRestaurantId),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/subscriptions/my-subscription');
      // The endpoint answers `{ data }`, but callers have always accepted the
      // bare row as well, so both shapes keep working.
      const unwrapped = (res as { data?: Subscription | null } | null)?.data ?? res;
      return (unwrapped ?? null) as Subscription | null;
    },
    enabled: isBillableContext,

    // An entitlement we already hold does not change while someone walks
    // between screens, and a minute of freshness is what makes that walk free.
    // The absence of one is the thing the user is on the billing page to
    // change, so it is never served from cache: upgrading and navigating away
    // has to unblock the app immediately.
    staleTime: (q) => (hasLiveEntitlement(q.state.data) ? 60_000 : 0),

    // The client default is `refetchOnMount: 'always'`, which would re-request
    // on every mount and undo the staleTime above.
    refetchOnMount: true,
  });

  return {
    subscription: query.data ?? null,
    isFirstLoad: query.isPending && query.fetchStatus === 'fetching',
    isError: query.isError,
    isFetching: query.isFetching,
  };
}
