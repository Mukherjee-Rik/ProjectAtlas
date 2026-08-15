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
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Security
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Manage your Atlas account security and session settings.
        </p>
      </div>

      {/* Account Security Information Card */}
      <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
        <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
          <h2 className="text-xl font-bold text-[#F5F7FA]">
            Authentication & Access
          </h2>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            Current authentication status and security credentials
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Access Token Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-sm font-semibold text-[#F5F7FA]">
                  Active JWT
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Session State
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-sm font-semibold text-[#F5F7FA]">
                  Authenticated
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Account Role
              </p>
              <div className="mt-1.5">
                {user?.role && <UserRoleBadge role={user.role as UserRole} />}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Account Status
              </p>
              <div className="mt-1.5">
                <UserStatusBadge status={(user?.status as UserStatus) || 'ACTIVE'} />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#26313C] flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#F5F7FA]">
                Password
              </p>
              <p className="mt-1 text-xs text-[#9AA6B2]">
                Last changed: Not available
              </p>
            </div>

            <button
              type="button"
              disabled
              className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-medium text-[#9AA6B2] cursor-not-allowed opacity-60"
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
