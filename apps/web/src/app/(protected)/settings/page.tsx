'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Settings
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Manage your Atlas platform preferences and security.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/settings/organization"
          className="block rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7] hover:bg-[#18212B]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#F5F7FA]">
              Organization
            </h2>
            <span className="text-[#2AFEB7]">→</span>
          </div>

          <p className="mt-2 text-sm text-[#9AA6B2]">
            View active tenant organization, role assignments, and access policies.
          </p>
        </Link>

        <Link
          href="/settings/security"
          className="block rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7] hover:bg-[#18212B]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#F5F7FA]">
              Security & Sessions
            </h2>
            <span className="text-[#2AFEB7]">→</span>
          </div>

          <p className="mt-2 text-sm text-[#9AA6B2]">
            Manage session state, password policies, and security credentials.
          </p>
        </Link>
      </div>
    </div>
  );
}
