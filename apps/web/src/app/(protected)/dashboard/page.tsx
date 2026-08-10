'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getDashboardOverview } from '@/services/dashboard.service';
import type { DashboardOverview } from '@/types/dashboard';

import { StatCard } from '@/components/dashboard/stat-card';
import { RecentUsers } from '@/components/dashboard/recent-users';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const response = await getDashboardOverview();
      setDashboard(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl">
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-[#9AA6B2]">
          We couldn't retrieve your dashboard data.
        </p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-6 rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalUsers = dashboard.users.total;
  const activeUsers = dashboard.users.active;
  const adminUsers = dashboard.users.admins;

  const activePercent = totalUsers > 0
    ? ((activeUsers / totalUsers) * 100).toFixed(1)
    : '0';

  const adminPercent = totalUsers > 0
    ? ((adminUsers / totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Header & Quick CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            Dashboard
          </h1>
          <p className="mt-2 text-[#9AA6B2]">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Operating in{' '}
            <span className="font-semibold text-[#F5F7FA]">
              {currentTenant?.name ?? 'Organization'}
            </span>
            {currentRestaurant && (
              <span>
                {' / '}
                <span className="font-semibold text-[#2AFEB7]">
                  {currentRestaurant.name}
                </span>
              </span>
            )}
            {currentBranch && (
              <span>
                {' / '}
                <span className="font-semibold text-[#F5F7FA]">
                  {currentBranch.name} ({currentBranch.code})
                </span>
              </span>
            )}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void loadDashboard(true)}
            className="flex items-center gap-2 rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-50"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>⟳</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/users/create')}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            Create User
          </button>
        </div>
      </div>

      {/* Operational Context Card */}
      <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#18212B] text-xl">
            📍
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Active Operational Location
            </p>
            <p className="text-sm font-bold text-[#F5F7FA]">
              {currentTenant?.name ?? '—'}
              {currentRestaurant && ` → ${currentRestaurant.name}`}
              {currentBranch && ` → ${currentBranch.name} (${currentBranch.code})`}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#2AFEB7]/15 px-3 py-1 text-xs font-semibold text-[#2AFEB7] border border-[#2AFEB7]/30">
          Context Active
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="TOTAL USERS"
          value={totalUsers}
          description="All registered users"
        />

        <StatCard
          title="ACTIVE USERS"
          value={activeUsers}
          description={`${activePercent}% of total users`}
        />

        <StatCard
          title="ADMIN USERS"
          value={adminUsers}
          description={`${adminPercent}% of total users`}
        />
      </div>

      {/* Main Grid: Recent Users + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentUsers users={dashboard.recentUsers} />
        </div>

        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
