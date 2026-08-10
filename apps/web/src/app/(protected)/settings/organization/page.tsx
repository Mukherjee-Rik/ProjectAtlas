'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Organization
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          View your current restaurant group organization and membership.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
        <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
          <h2 className="text-xl font-bold text-[#F5F7FA]">
            Current Organization
          </h2>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            Tenant organization context for your active session
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Organization Name
              </p>
              <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
                {currentTenant?.name ?? 'Mukherjee Restaurant Group'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Tenant Slug
              </p>
              <p className="mt-1.5 text-sm font-mono text-[#2AFEB7]">
                {currentTenant?.slug ?? 'mukherjee-restaurants'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Your Role
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block rounded-full bg-[#2AFEB7]/15 px-3 py-1 text-xs font-semibold text-[#2AFEB7] border border-[#2AFEB7]/30">
                  {user?.role ?? 'ADMIN'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
                Organization Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                <span className="text-sm font-semibold text-[#F5F7FA]">
                  {currentTenant?.status ?? 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#26313C] text-xs text-[#9AA6B2]">
            <p>• Multi-tenant security enforces tenant boundaries on all database queries.</p>
            <p className="mt-1">• Organization switching and membership management CRUD will be available in future sprints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
