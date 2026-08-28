'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function PublicOnlyRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    isAuthenticated,
    isLoading,
    user,
  } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (isAuthenticated) {
      router.push(user?.role === 'PLATFORM_ADMIN' ? '/platform-admin' : '/dashboard');
    }
  }, [mounted, isLoading, isAuthenticated, router, user?.role]);

  if (!mounted || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
