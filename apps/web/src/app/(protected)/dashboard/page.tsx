'use client';

import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Dashboard
        </h1>

        <p className="mt-2 text-[#9AA6B2]">
          Welcome back, {user?.name}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 shadow-sm">
          <p className="text-sm text-[#9AA6B2]">
            Account
          </p>

          <p className="mt-2 text-xl font-semibold text-[#22C55E]">
            Active
          </p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 shadow-sm">
          <p className="text-sm text-[#9AA6B2]">
            Role
          </p>

          <p className="mt-2 text-xl font-semibold text-[#2AFEB7]">
            {user?.role}
          </p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 shadow-sm">
          <p className="text-sm text-[#9AA6B2]">
            Email
          </p>

          <p className="mt-2 truncate text-sm font-medium text-[#F5F7FA]">
            {user?.email}
          </p>
        </div>

        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-5 shadow-sm">
          <p className="text-sm text-[#9AA6B2]">
            Atlas
          </p>

          <p className="mt-2 text-xl font-semibold text-[#2AFEB7]">
            Ready
          </p>
        </div>
      </section>
    </div>
  );
}
