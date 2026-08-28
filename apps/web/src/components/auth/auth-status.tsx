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
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-muted-foreground">
        Not signed in
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          {user?.name}
        </p>

        <p className="text-xs text-muted-foreground">
          {user?.email}
        </p>
      </div>

      <button
        onClick={logout}
        className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        Logout
      </button>
    </div>
  );
}
