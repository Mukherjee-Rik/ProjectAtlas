'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getDashboardOverview, getDashboardAnalytics } from '@/services/dashboard.service';
import type { DashboardOverview, DashboardAnalytics } from '@/types/dashboard';

import { StatCard } from '@/components/dashboard/stat-card';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { PlatformAdminDashboard } from '@/components/dashboard/platform-admin-dashboard';
import { AnalyticsDetailModal, AnalyticsModalMode } from '@/components/dashboard/revenue-detail-modal';
import { formatCurrency } from '@/lib/currency';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  
  // Date Helpers
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return formatLocalDate(d);
  };

  const getTodayDateStr = () => {
    return formatLocalDate(new Date());
  };

  // Date state filters
  const [startDate, setStartDate] = useState(getPastDateStr(30));
  const [endDate, setEndDate] = useState(getTodayDateStr());

  // Overview state
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [modalMode, setModalMode] = useState<AnalyticsModalMode | null>(null);

  const loadDashboard = useCallback(async (showRefreshing = false, start?: string, end?: string) => {
    if (user?.role === 'PLATFORM_ADMIN') {
      setIsLoading(false);
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const actualStart = start !== undefined ? start : startDate;
      const actualEnd = end !== undefined ? end : endDate;
      const response = await getDashboardOverview(actualStart, actualEnd);
      setDashboard(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load restaurant dashboard overview');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.role, startDate, endDate]);

  const loadAnalytics = useCallback(async (showLoading = true, start?: string, end?: string) => {
    if (showLoading) setIsLoadingAnalytics(true);
    setAnalyticsError('');

    try {
      const actualStart = start !== undefined ? start : startDate;
      const actualEnd = end !== undefined ? end : endDate;
      const response = await getDashboardAnalytics(actualStart, actualEnd);
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
      setAnalyticsError('Unable to load restaurant advanced analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [startDate, endDate]);

  // Load dashboard and analytics when dates or active tab change
  useEffect(() => {
    void loadDashboard(false, startDate, endDate);
    if (activeTab === 'analytics') {
      void loadAnalytics(false, startDate, endDate);
    } else {
      setAnalytics(null);
    }
  }, [startDate, endDate, activeTab]);

  if (user?.role === 'PLATFORM_ADMIN') {
    return <PlatformAdminDashboard />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl">
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Unable to load restaurant dashboard
        </h2>
        <p className="mt-2 text-sm text-[#9AA6B2]">
          We couldn't retrieve your restaurant data.
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

  const { metrics, recentOrders, restaurantStaff } = dashboard;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SERVED':
        return 'bg-[#2AFEB7]/10 text-[#2AFEB7] border-[#2AFEB7]/30';
      case 'PREPARING':
      case 'READY':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30';
      case 'CONFIRMED':
      case 'PENDING':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';
      case 'CANCELLED':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30';
      default:
        return 'bg-[#18212B] text-[#9AA6B2] border-[#26313C]';
    }
  };

  // Find max sales for SVG trend scaling
  const maxSales = analytics?.salesTrend?.length
    ? Math.max(...analytics.salesTrend.map((t) => t.sales), 100)
    : 100;

  // Find max hourly count for hourly scaling
  const maxHourlyCount = analytics?.peakHours?.length
    ? Math.max(...analytics.peakHours.map((t) => t.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            {currentRestaurant?.name ?? currentTenant?.name ?? 'Restaurant Dashboard'}
          </h1>
          <p className="mt-1 text-xs text-[#9AA6B2]">
            Welcome back, <span className="font-semibold text-[#F5F7FA]">{user?.name ?? 'Manager'}</span>! Operating in{' '}
            <span className="font-semibold text-[#2AFEB7]">
              {currentRestaurant?.name ?? currentTenant?.name ?? 'Workspace'}
            </span>
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
          {activeTab === 'overview' ? (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void loadDashboard(true)}
              className="flex items-center gap-2 rounded-xl border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-xs font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-50"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>⟳</span>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoadingAnalytics}
              onClick={() => void loadAnalytics(true)}
              className="flex items-center gap-2 rounded-xl border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-xs font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-50"
            >
              <span className={isLoadingAnalytics ? 'animate-spin' : ''}>⟳</span>
              <span>{isLoadingAnalytics ? 'Updating...' : 'Reload'}</span>
            </button>
          )}

          <Link
            href="/menus"
            className="rounded-xl bg-[#2AFEB7] px-4 py-2 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            + Add Menu Item
          </Link>
        </div>
      </div>

      {/* Date Pickers Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#F5F7FA]">📅 Date Range Filter</span>
          <span className="text-[10px] text-[#9AA6B2]">Filter sales, orders & charts</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9AA6B2]">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9AA6B2]">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-xs text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate(getPastDateStr(30));
              setEndDate(getTodayDateStr());
            }}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-[11px] font-bold text-[#9AA6B2] hover:text-[#F5F7FA] hover:border-[#2AFEB7]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#26313C] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 relative ${
            activeTab === 'overview'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 relative ${
            activeTab === 'analytics'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
          }`}
        >
          Advanced Analytics
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Operational Location Banner */}
          <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18212B] text-lg">
                🍴
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Restaurant Operational Workspace
                </p>
                <p className="text-xs font-bold text-[#F5F7FA]">
                  {currentRestaurant?.name ?? currentTenant?.name ?? 'Workspace'}
                  {currentBranch && ` → ${currentBranch.name} (${currentBranch.code})`}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[#2AFEB7]/15 px-3 py-0.5 text-[10px] font-semibold text-[#2AFEB7] border border-[#2AFEB7]/30">
              Workspace Active
            </span>
          </div>

          {/* Restaurant Operational Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="TOTAL SALES"
              value={formatCurrency(metrics.totalSales)}
              description="Total sales revenue generated"
            />

            <StatCard
              title="TOTAL ORDERS"
              value={metrics.totalOrders}
              description="All-time restaurant customer orders"
            />

            <StatCard
              title="ACTIVE TABLES"
              value={metrics.activeTables}
              description="Tables configured across dining areas"
            />

            <StatCard
              title="ACTIVE MENU ITEMS"
              value={metrics.menuItems}
              description="Dishes & beverages available"
            />
          </div>

          {/* Main Grid: Live Orders Stream + Restaurant Staff */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Orders Stream */}
            {/* min-w-0: a grid item defaults to min-width:auto and will not
                shrink below its content, so without this the table below
                stretched the whole page wider than the phone viewport. */}
            <div className="min-w-0 lg:col-span-2 space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#F5F7FA]">Live Recent Orders</h2>
                  <p className="text-[11px] text-[#9AA6B2]">
                    Latest customer table orders for {currentRestaurant?.name ?? 'this restaurant'}.
                  </p>
                </div>

                <Link href="/orders" className="text-xs font-semibold text-[#2AFEB7] hover:underline">
                  View All Orders →
                </Link>
              </div>

              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#26313C] text-[#9AA6B2] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Table</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26313C]/50">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#18212B]/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#F5F7FA]">{ord.orderNumber}</td>
                        <td className="py-2.5 px-3 text-[#9AA6B2]">{ord.tableName}</td>
                        <td className="py-2.5 px-3 text-[#9AA6B2]">{ord.itemCount} items</td>
                        <td className="py-2.5 px-3 font-bold text-[#2AFEB7]">{formatCurrency(ord.totalAmount)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${getStatusStyle(ord.status)}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#9AA6B2]">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}

                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#9AA6B2]">
                          No customer orders placed for this restaurant yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restaurant Employees & Staff */}
            <div className="lg:col-span-1 space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#F5F7FA]">Restaurant Staff</h2>
                  <p className="text-[11px] text-[#9AA6B2]">
                    Employees working at {currentRestaurant?.name ?? 'this restaurant'}.
                  </p>
                </div>
                <span className="rounded-full bg-[#18212B] px-2 py-0.5 text-[10px] font-mono text-[#2AFEB7] border border-[#26313C]">
                  {metrics.staffCount} Staff
                </span>
              </div>

              <div className="space-y-3">
                {restaurantStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between rounded-xl border border-[#26313C] bg-[#18212B] p-3 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#F5F7FA]">{staff.name}</p>
                      <p className="text-[10px] text-[#9AA6B2]">{staff.email}</p>
                    </div>
                    <span className="rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-2 py-0.5 text-[9px] font-bold text-[#2AFEB7]">
                      {staff.role}
                    </span>
                  </div>
                ))}

                {restaurantStaff.length === 0 && (
                  <p className="py-4 text-center text-xs text-[#9AA6B2]">
                    No staff members assigned yet.
                  </p>
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-4 border-t border-[#26313C] space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/menus"
                    className="rounded-xl border border-[#26313C] bg-[#18212B] p-2.5 text-center text-[11px] font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] transition-colors"
                  >
                    🍴 Manage Menu
                  </Link>
                  <Link
                    href="/tables"
                    className="rounded-xl border border-[#26313C] bg-[#18212B] p-2.5 text-center text-[11px] font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] transition-colors"
                  >
                    🪑 View Tables
                  </Link>
                  <Link
                    href="/orders"
                    className="rounded-xl border border-[#26313C] bg-[#18212B] p-2.5 text-center text-[11px] font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] transition-colors"
                  >
                    🛒 Orders Stream
                  </Link>
                  <Link
                    href="/branches"
                    className="rounded-xl border border-[#26313C] bg-[#18212B] p-2.5 text-center text-[11px] font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] transition-colors"
                  >
                    📍 Branches
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {isLoadingAnalytics ? (
            <div className="rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center text-sm text-[#9AA6B2] animate-pulse">
              Generating restaurant performance analysis...
            </div>
          ) : analyticsError || !analytics ? (
            <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-xs text-[#EF4444]">
              {analyticsError || 'Failed to load analytics details.'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* 1. Total Revenue Card */}
                <div
                  onClick={() => setModalMode('revenue')}
                  className="group relative cursor-pointer rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl transition-all duration-200 hover:border-[#2AFEB7] hover:bg-[#18212B] hover:shadow-[#2AFEB7]/10 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2] group-hover:text-[#2AFEB7] transition-colors">
                      Total Revenue (Last 30d)
                    </span>
                    <span className="rounded-full bg-[#2AFEB7]/10 px-2 py-0.5 text-[9px] font-bold text-[#2AFEB7] border border-[#2AFEB7]/20 group-hover:bg-[#2AFEB7] group-hover:text-[#0B0F14] transition-all">
                      View Details 🔍
                    </span>
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-[#2AFEB7]">
                    {formatCurrency(analytics.metrics.totalRevenue)}
                  </h3>
                  <p className="mt-1 text-[10px] text-[#9AA6B2] flex items-center justify-between">
                    <span>Includes base prices + tax</span>
                    <span className="text-[#2AFEB7] font-semibold underline underline-offset-2">
                      Click for tax & subtotal
                    </span>
                  </p>
                </div>

                {/* 2. Completed Orders Card */}
                <div
                  onClick={() => setModalMode('orders')}
                  className="group relative cursor-pointer rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl transition-all duration-200 hover:border-[#F5F7FA] hover:bg-[#18212B] hover:shadow-white/5 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2] group-hover:text-[#F5F7FA] transition-colors">
                      Completed Orders (30d)
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-[#F5F7FA] border border-white/20 group-hover:bg-[#F5F7FA] group-hover:text-[#0B0F14] transition-all">
                      View Details 🔍
                    </span>
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-[#F5F7FA]">
                    {analytics.metrics.totalOrders}
                  </h3>
                  <p className="mt-1 text-[10px] text-[#9AA6B2] flex items-center justify-between">
                    <span>Successful sales volume</span>
                    <span className="text-[#F5F7FA] font-semibold underline underline-offset-2">
                      Click for tables & channels
                    </span>
                  </p>
                </div>

                {/* 3. Average Order Value Card */}
                <div
                  onClick={() => setModalMode('aov')}
                  className="group relative cursor-pointer rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl transition-all duration-200 hover:border-[#3B82F6] hover:bg-[#18212B] hover:shadow-[#3B82F6]/10 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2] group-hover:text-[#3B82F6] transition-colors">
                      Average Order Value
                    </span>
                    <span className="rounded-full bg-[#3B82F6]/10 px-2 py-0.5 text-[9px] font-bold text-[#3B82F6] border border-[#3B82F6]/20 group-hover:bg-[#3B82F6] group-hover:text-[#0B0F14] transition-all">
                      View Details 🔍
                    </span>
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-[#3B82F6]">
                    {formatCurrency(analytics.metrics.averageOrderValue)}
                  </h3>
                  <p className="mt-1 text-[10px] text-[#9AA6B2] flex items-center justify-between">
                    <span>AOV per check ticket</span>
                    <span className="text-[#3B82F6] font-semibold underline underline-offset-2">
                      Click for ticket tiers
                    </span>
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Sales Trend SVG Area Chart */}
                <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F7FA]">Daily Sales Trend</h4>
                    <p className="text-[10px] text-[#9AA6B2]">Revenue generated over the last 30 days</p>
                  </div>

                  <div className="relative h-44 w-full">
                    {/* Y Axis Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full border-b border-[#26313C]/30 text-[9px] text-[#9AA6B2] pb-0.5">₹{maxSales.toFixed(0)}</div>
                      <div className="w-full border-b border-[#26313C]/30 text-[9px] text-[#9AA6B2] pb-0.5">₹{(maxSales / 2).toFixed(0)}</div>
                      <div className="w-full text-[9px] text-[#9AA6B2]">₹0</div>
                    </div>

                    {/* Bars Grid */}
                    <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-between gap-1 px-1">
                      {analytics.salesTrend.map((t, idx) => {
                        const heightPct = (t.sales / maxSales) * 100;
                        return (
                          <div
                            key={t.date}
                            className="group relative flex-1 flex flex-col items-center justify-end h-full"
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 rounded bg-[#18212B] border border-[#26313C] px-2 py-1 text-[9px] whitespace-nowrap text-[#F5F7FA] font-bold shadow-xl">
                              {t.date}: {formatCurrency(t.sales)} ({t.orders} orders)
                            </div>
                            {/* Bar segment */}
                            <div
                              style={{ height: `${Math.max(heightPct, 2)}%` }}
                              className={`w-full rounded-t transition-all ${
                                heightPct > 0 ? 'bg-[#2AFEB7]/80 hover:bg-[#2AFEB7]' : 'bg-[#26313C]/40'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between text-[9px] text-[#9AA6B2] pt-1">
                    <span>30 Days Ago</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* 2. Peak Hours Histogram */}
                <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F7FA]">Peak Operating Hours</h4>
                    <p className="text-[10px] text-[#9AA6B2]">Order counts distributed across hours of the day</p>
                  </div>

                  <div className="relative h-44 w-full">
                    {/* Y Axis Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full border-b border-[#26313C]/30 text-[9px] text-[#9AA6B2] pb-0.5">{maxHourlyCount} Orders</div>
                      <div className="w-full border-b border-[#26313C]/30 text-[9px] text-[#9AA6B2] pb-0.5">{Math.floor(maxHourlyCount / 2)} Orders</div>
                      <div className="w-full text-[9px] text-[#9AA6B2]">0</div>
                    </div>

                    {/* Hourly Bars */}
                    <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-between gap-0.5">
                      {analytics.peakHours.map((t) => {
                        const heightPct = (t.count / maxHourlyCount) * 100;
                        return (
                          <div
                            key={t.hour}
                            className="group relative flex-1 flex flex-col items-center justify-end h-full"
                          >
                            <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 rounded bg-[#18212B] border border-[#26313C] px-2 py-1 text-[9px] whitespace-nowrap text-[#F5F7FA] font-bold shadow-xl">
                              {t.hour}:00 - {t.count} orders
                            </div>
                            <div
                              style={{ height: `${Math.max(heightPct, 2)}%` }}
                              className={`w-full rounded-t transition-all ${
                                heightPct > 0 ? 'bg-[#3B82F6]/80 hover:bg-[#3B82F6]' : 'bg-[#26313C]/40'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between text-[9px] text-[#9AA6B2] pt-1">
                    <span>12 AM (0)</span>
                    <span>12 PM (12)</span>
                    <span>11 PM (23)</span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Popular items and Branch comparison */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 3. Popular Menu Items */}
                <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F7FA]">Top 5 Selling Items</h4>
                    <p className="text-[10px] text-[#9AA6B2]">Most ordered menu items by quantity</p>
                  </div>

                  <div className="space-y-4">
                    {analytics.popularItems.map((item, index) => {
                      const maxQty = analytics.popularItems[0]?.count || 1;
                      const widthPct = (item.count / maxQty) * 100;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#2AFEB7]">#{index + 1}</span>
                              <span className="font-bold text-[#F5F7FA]">{item.name}</span>
                            </div>
                            <span className="font-semibold text-[#9AA6B2]">
                              {item.count} items ({formatCurrency(item.revenue)})
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#18212B] overflow-hidden">
                            <div
                              style={{ width: `${widthPct}%` }}
                              className="h-full bg-gradient-to-r from-[#2AFEB7]/60 to-[#2AFEB7] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {analytics.popularItems.length === 0 && (
                      <p className="py-8 text-center text-xs text-[#9AA6B2]">
                        No orders recorded to analyze popular dishes yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Branch Performance Matrix */}
                <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-5 shadow-xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F7FA]">Branch Sales Performance</h4>
                    <p className="text-[10px] text-[#9AA6B2]">Comparison breakdown across locations</p>
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#26313C] text-[#9AA6B2] uppercase tracking-wider">
                            <th className="py-2 px-1">Branch Name</th>
                            <th className="py-2 px-1 text-right">Orders</th>
                            <th className="py-2 px-1 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26313C]/50">
                          {analytics.branchPerformance.map((br) => (
                            <tr key={br.branchName} className="hover:bg-[#18212B]/40">
                              <td className="py-2.5 px-1 font-bold text-[#F5F7FA]">{br.branchName}</td>
                              <td className="py-2.5 px-1 text-right text-[#9AA6B2]">{br.orders} orders</td>
                              <td className="py-2.5 px-1 text-right font-black text-[#2AFEB7]">
                                {formatCurrency(br.sales)}
                              </td>
                            </tr>
                          ))}

                          {analytics.branchPerformance.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-[#9AA6B2]">
                                No branch data recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Analytics Breakdown Modal (Supports all 3 cards: Revenue, Orders, AOV) */}
      <AnalyticsDetailModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        initialMode={modalMode || 'revenue'}
        breakdown={analytics?.revenueBreakdown}
        metrics={analytics?.metrics || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }}
      />
    </div>
  );
}
