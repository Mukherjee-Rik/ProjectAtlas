'use client';

import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-6 bg-secondary/40">
        <h2 className="text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Common management tasks
        </p>
      </div>

      <div className="p-4 space-y-2">
        <Link
          href="/users/create"
          className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <span>+ Add User</span>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/users"
          className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <span>→ View Users</span>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <span>⚙ Settings</span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>
    </div>
  );
}
