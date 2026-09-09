'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton, SkeletonTable } from '@/components/ui/primitives';

interface RoleScope {
  /** Where a member of this role is sent when they land somewhere else. */
  home: string;
  /** Route prefixes this role may reach. */
  allowed: string[];
}

/**
 * Floor roles each get one home surface and are held to it. The prefixes and
 * the home route are declared together so the redirect and the render guard
 * below cannot disagree about what a role may see — a disagreement there would
 * either flash forbidden content or strand the user on a placeholder. Roles
 * absent from this map (OWNER, MANAGER, PLATFORM_ADMIN, …) are unrestricted.
 */
const ROLE_SCOPES: Partial<Record<string, RoleScope>> = {
  CASHIER: { home: '/cashier', allowed: ['/cashier', '/kitchen', '/profile', '/api'] },
  WAITER: { home: '/waiter', allowed: ['/waiter', '/kitchen', '/profile', '/api'] },
  STAFF: {
    home: '/waiter',
    allowed: ['/waiter', '/cashier', '/kitchen', '/profile', '/api'],
  },
  KITCHEN: { home: '/kitchen', allowed: ['/kitchen', '/profile', '/api'] },
};

/**
 * The AppShell's own geometry — a 4rem header, a sidebar rail from `md` up, and
 * a padded content column — so the frame the user waits on is the frame they
 * end up with. `100dvh` rather than `100vh`: on mobile Safari and Chrome the
 * latter is taller than the visible viewport and leaves a phantom scroll.
 */
function AppShellSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-[100dvh] bg-background" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>

      <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4 md:px-8">
        <Skeleton className="h-9 w-9 md:hidden" />
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-64 shrink-0 space-y-2 border-r border-border bg-card p-4 md:block lg:w-72">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>

        <div className="min-w-0 flex-1 space-y-6 p-4 sm:space-y-8 md:p-6 lg:p-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <SkeletonTable rows={4} columns={4} />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const scope = user ? ROLE_SCOPES[user.role] : undefined;
  const isOutOfScope = Boolean(
    scope && !scope.allowed.some((prefix) => pathname.startsWith(prefix)),
  );

  useEffect(() => {
    if (!mounted) return;

    // These all target routes inside this app with no provider state to
    // rebuild, so `router.replace` rather than a document load: a hard
    // navigation re-downloads the whole bundle and boots the app a second
    // time. `replace` also keeps the blocked URL out of history, so Back does
    // not bounce straight back here.
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (scope && isOutOfScope) {
      router.replace(scope.home);
    }
  }, [mounted, isAuthenticated, router, scope, isOutOfScope]);

  // `mounted` is the hydration gate: the server has no localStorage, so the
  // session is only known once we are in the browser. Painting the shell's
  // shape rather than a spinner means the first frame is already the layout
  // the app is about to fill in.
  if (!mounted) {
    return <AppShellSkeleton label="Loading Kafei…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // A redirect is in flight. Rendering children here would let a role see a
  // screen it is not entitled to — and let that screen fire its own queries —
  // for as long as the navigation takes.
  if (isOutOfScope) {
    return <AppShellSkeleton label="Taking you to your workspace…" />;
  }

  return <>{children}</>;
}
