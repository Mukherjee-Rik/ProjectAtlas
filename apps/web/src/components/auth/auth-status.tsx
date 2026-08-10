'use client';

import { useAuth } from '@/hooks/use-auth';

export function AuthStatus() {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="text-sm text-[#9AA6B2]">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-[#9AA6B2]">
        Not signed in
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm font-medium text-[#F5F7FA]">
          {user?.name}
        </p>

        <p className="text-xs text-[#9AA6B2]">
          {user?.email}
        </p>
      </div>

      <button
        onClick={logout}
        className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-sm text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
      >
        Logout
      </button>
    </div>
  );
}
