'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function PublicOnlyRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14]">
        <p className="text-[#9AA6B2]">
          Loading...
        </p>
      </main>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
