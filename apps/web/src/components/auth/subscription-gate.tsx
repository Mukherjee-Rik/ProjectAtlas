'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';

/** The one route a restaurant without an entitlement is still allowed to reach. */
const BILLING_ROUTE = '/subscriptions';

type Entitlement = 'checking' | 'allowed' | 'blocked';

interface SubscriptionLike {
  status?: string;
  trialEnd?: string | null;
  plan?: { name?: string } | null;
}

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
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();

  const [entitlement, setEntitlement] = useState<Entitlement>('checking');
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    // Platform staff administer the platform itself, and a session with no
    // restaurant selected is still finding its feet — neither is billable yet.
    if (!user || user.role === 'PLATFORM_ADMIN' || !currentRestaurant?.id) {
      setEntitlement('allowed');
      return;
    }

    let active = true;

    apiClient
      .get<unknown>('/subscriptions/my-subscription')
      .then((res) => {
        if (!active) return;
        const sub = ((res as { data?: SubscriptionLike })?.data ??
          res) as SubscriptionLike | null;

        setPlanName(sub?.plan?.name ?? null);

        const paidAndActive = sub?.status === 'ACTIVE';
        const trialStillRunning =
          sub?.status === 'TRIALING' &&
          (!sub.trialEnd || new Date(sub.trialEnd).getTime() > Date.now());

        setEntitlement(paidAndActive || trialStillRunning ? 'allowed' : 'blocked');
      })
      .catch(() => {
        // A 404 here means no subscription row at all, which is as blocking as an
        // expired one. Anything else (network, 500) is treated the same way rather
        // than failing open.
        if (active) setEntitlement('blocked');
      });

    return () => {
      active = false;
    };
  }, [user, currentRestaurant, pathname]);

  const onBillingPage = pathname?.startsWith(BILLING_ROUTE) ?? false;

  useEffect(() => {
    if (entitlement === 'blocked' && !onBillingPage) {
      router.replace(BILLING_ROUTE);
    }
  }, [entitlement, onBillingPage, router]);

  if (entitlement === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
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
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              {planName ? `Your ${planName} period has ended` : 'Your free trial has ended'}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose Starter or higher to reopen the floor. Your tables, menus and
              orders are all still here.
            </p>
          </div>
          <Link
            href={BILLING_ROUTE}
            className="inline-block rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-background transition-colors hover:bg-primary-hover"
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
