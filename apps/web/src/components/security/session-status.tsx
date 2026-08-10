'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function SessionStatus() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
      <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Current Session
        </h2>
        <p className="mt-1 text-sm text-[#9AA6B2]">
          Details about your active authentication session
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-[#26313C] bg-[#18212B] p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <span className="text-sm font-semibold text-[#F5F7FA]">
                Authenticated
              </span>
            </div>
            <p className="text-xs text-[#9AA6B2]">
              Signed in as <span className="text-[#F5F7FA] font-medium">{user?.email ?? 'Unknown'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-2 text-sm font-semibold text-[#EF4444] transition-all hover:bg-[#EF4444]/20 active:scale-[0.99]"
          >
            Sign Out
          </button>
        </div>

        <div className="text-xs text-[#9AA6B2] space-y-1">
          <p>• Token storage: Web Browser LocalStorage</p>
          <p>• Unauthorized API requests (401) will automatically revoke session state.</p>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign Out of Atlas"
        description="Are you sure you want to sign out? You will need to log in again to access protected areas."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={logout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
