'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton, SkeletonText } from '@/components/ui/primitives';

/**
 * Shaped like the centred auth card these routes render, rather than a bare
 * spinner, so the hydration frame and the signed-out frame are the same size.
 * `100dvh` keeps the card optically centred on mobile browsers, where `100vh`
 * includes the retracted URL bar.
 */
function AuthCardSkeleton({ label }: { label: string }) {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-background p-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>

      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <SkeletonText lines={2} />
      </div>
    </main>
  );
}

export function PublicOnlyRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isAuthenticated) {
      router.replace(
        user?.role === 'PLATFORM_ADMIN' ? '/platform-admin' : '/dashboard',
      );
    }
  }, [mounted, isAuthenticated, router, user?.role]);

  // The session is only readable once we are in the browser, so this is a
  // hydration gate rather than a load state.
  if (!mounted) {
    return <AuthCardSkeleton label="Loading…" />;
  }

  if (isAuthenticated) {
    // Redirect in flight — never show a sign-in form to someone already in.
    return <AuthCardSkeleton label="Taking you to your workspace…" />;
  }

  return <>{children}</>;
}
