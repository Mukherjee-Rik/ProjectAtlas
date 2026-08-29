'use client';

import { useAuth } from '@/hooks/use-auth';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { SessionsList } from '@/components/auth/sessions-list';

import type { UserRole, UserStatus } from '@/types/user';

export default function SecuritySettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          Security
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your Kafei account security and session settings.
        </p>
      </div>

      {/* Account Security Information Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-6 bg-secondary/40">
          <h2 className="text-xl font-bold text-foreground">
            Authentication & Access
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current authentication status and security credentials
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Access Token Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-atlas-success" />
                <span className="text-sm font-semibold text-foreground">
                  Active JWT
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Session State
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-atlas-success" />
                <span className="text-sm font-semibold text-foreground">
                  Authenticated
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Account Role
              </p>
              <div className="mt-1.5">
                {user?.role && <UserRoleBadge role={user.role as UserRole} />}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Account Status
              </p>
              <div className="mt-1.5">
                <UserStatusBadge status={(user?.status as UserStatus) || 'ACTIVE'} />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Password
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last changed: Not available
              </p>
            </div>

            <button
              type="button"
              disabled
              className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60"
            >
              Change Password (Coming soon)
            </button>
          </div>
        </div>
      </div>

      {/* Active Device Sessions List */}
      <SessionsList />
    </div>
  );
}
