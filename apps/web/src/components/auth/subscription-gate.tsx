'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { hasLiveEntitlement, useMySubscription } from '@/hooks/use-my-subscription';
import { Skeleton, SkeletonTable } from '@/components/ui/primitives';

/** The one route a restaurant without an entitlement is still allowed to reach. */
const BILLING_ROUTE = '/subscriptions';

type Entitlement = 'checking' | 'allowed' | 'blocked';

/**
 * Holds the app closed until the restaurant has an entitlement to use it.
 *
 * A trial is an entitlement while it is running; once trialEnd passes, the only
 * page that renders is the billing page, and every other protected route bounces
 * back to it. Without this the trial had no consequence at all — it expired on
 * paper while the app carried on working.
 *
 * This is the visible half of the rule. The API enforces the same thing on write
 * paths: SubscriptionUsageService refuses to create a table, staff member, branch
 * or menu without a live subscription, so the gate is not the only thing standing
 * between an expired trial and the data.
 *
 * The check reads from `useMySubscription`, which is shared with AppShell, so the
 * two of them make one request instead of two. Only a genuinely first-ever load
 * waits on it: once an answer is cached, children render while it revalidates,
 * because holding the whole app behind a placeholder to re-confirm something we
 * already know is what made every navigation feel slow. A missing or negative
 * answer still blocks — the gate fails closed, never open.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentRestaurantId } = useRestaurant();
  const { subscription, isFirstLoad, isError } = useMySubscription();

  // Platform staff administer the platform itself, and a session with no
  // restaurant selected is still finding its feet — neither is billable yet.
  const isExempt =
    !user || user.role === 'PLATFORM_ADMIN' || !currentRestaurantId;

  let entitlement: Entitlement;
  if (isExempt) {
    entitlement = 'allowed';
  } else if (isError) {
    // A 404 here means no subscription row at all, which is as blocking as an
    // expired one. Anything else (network, 500) is treated the same way rather
    // than failing open.
    entitlement = 'blocked';
  } else if (isFirstLoad) {
    entitlement = 'checking';
  } else {
    entitlement = hasLiveEntitlement(subscription) ? 'allowed' : 'blocked';
  }

  const planName = subscription?.plan?.name ?? null;
  const onBillingPage = pathname?.startsWith(BILLING_ROUTE) ?? false;

  useEffect(() => {
    if (entitlement === 'blocked' && !onBillingPage) {
      router.replace(BILLING_ROUTE);
    }
  }, [entitlement, onBillingPage, router]);

  if (entitlement === 'checking') {
    // Shaped like the page that is about to arrive, and like the route-level
    // loading state, so the first answer does not re-lay-out the screen.
    return (
      <div className="space-y-6 sm:space-y-8" role="status" aria-live="polite">
        <span className="sr-only">Checking your subscription…</span>

        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <SkeletonTable rows={4} columns={4} />
      </div>
    );
  }

  // Blocked and on the billing page: let the page through so they can pick a plan.
  if (entitlement === 'blocked' && onBillingPage) {
    return <>{children}</>;
  }

  // Blocked anywhere else: show the reason rather than a flash of app content
  // while the redirect lands.
  if (entitlement === 'blocked') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              {planName ? `Your ${planName} period has ended` : 'Your free trial has ended'}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choose Starter or higher to reopen the floor. Your tables, menus and
              orders are all still here.
            </p>
          </div>
          <Link
            href={BILLING_ROUTE}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            See plans
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default SubscriptionGate;
