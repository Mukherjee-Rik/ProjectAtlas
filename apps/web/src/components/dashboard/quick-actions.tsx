'use client';

import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
      <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
        <h2 className="text-lg font-semibold text-[#F5F7FA]">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-[#9AA6B2]">
          Common management tasks
        </p>
      </div>

      <div className="p-4 space-y-2">
        <Link
          href="/users/create"
          className="flex items-center justify-between rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-3 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          <span>+ Add User</span>
          <span className="text-[#9AA6B2]">→</span>
        </Link>

        <Link
          href="/users"
          className="flex items-center justify-between rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-3 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          <span>→ View Users</span>
          <span className="text-[#9AA6B2]">→</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center justify-between rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-3 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          <span>⚙ Settings</span>
          <span className="text-[#9AA6B2]">→</span>
        </Link>
      </div>
    </div>
  );
}
