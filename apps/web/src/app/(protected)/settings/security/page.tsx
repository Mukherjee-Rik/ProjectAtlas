'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { SessionsList } from '@/components/auth/sessions-list';
import { PageHeader } from '@/components/ui/primitives';

import type { UserRole, UserStatus } from '@/types/user';

export default function SecuritySettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security"
        description="Manage your Kafei account security and session settings."
      />

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

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="min-w-0">
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

      {/* Privacy, Google OAuth & Account Erasure Card */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Privacy Rights & Data Portability
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Export personal data in JSON format, manage Google OAuth permissions, or permanently scrub your account.
          </p>
        </div>
        {/* next/link keeps this a client transition: a plain <a> re-bootstrapped
            the whole app, including the layout-level entitlement request. */}
        <Link
          href="/settings/privacy"
          role="button"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background shadow transition-all hover:bg-primary-hover active:scale-[0.98]"
        >
          Manage Data & Privacy
        </Link>
      </div>

      {/* Active Device Sessions List */}
      <SessionsList />
    </div>
  );
}
