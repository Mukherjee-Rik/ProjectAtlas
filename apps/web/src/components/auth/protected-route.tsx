'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (isAuthenticated && user) {
      // WAITER and STAFF (Cashier) are restricted to /waiter and /profile
      if (user.role === 'WAITER' || user.role === 'STAFF') {
        if (!pathname.startsWith('/waiter') && !pathname.startsWith('/profile') && !pathname.startsWith('/api')) {
          window.location.href = '/waiter';
        }
      }
      // KITCHEN role is restricted to /kitchen and /profile
      else if (user.role === 'KITCHEN') {
        if (!pathname.startsWith('/kitchen') && !pathname.startsWith('/profile') && !pathname.startsWith('/api')) {
          window.location.href = '/kitchen';
        }
      }
    }
  }, [mounted, isLoading, isAuthenticated, user, pathname]);

  if (!mounted || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14]">
        <div className="h-6 w-6 border-2 border-[#2AFEB7] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
