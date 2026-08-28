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
      // CASHIER is restricted to /cashier, /kitchen, /profile
      if (user.role === 'CASHIER') {
        if (!pathname.startsWith('/cashier') && !pathname.startsWith('/kitchen') && !pathname.startsWith('/profile') && !pathname.startsWith('/api')) {
          window.location.href = '/cashier';
        }
      }
      // WAITER is restricted to /waiter, /kitchen, /profile
      else if (user.role === 'WAITER') {
        if (!pathname.startsWith('/waiter') && !pathname.startsWith('/kitchen') && !pathname.startsWith('/profile') && !pathname.startsWith('/api')) {
          window.location.href = '/waiter';
        }
      }
      // STAFF is restricted to /waiter, /cashier, /kitchen, /profile
      else if (user.role === 'STAFF') {
        if (!pathname.startsWith('/waiter') && !pathname.startsWith('/cashier') && !pathname.startsWith('/kitchen') && !pathname.startsWith('/profile') && !pathname.startsWith('/api')) {
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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
