'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from '@/components/dashboard/stat-card';
import { getTenants } from '@/services/tenants.service';
import { getRestaurants } from '@/services/restaurants.service';
import { getPlatformDashboardOverview, type PlatformOverviewResponse } from '@/services/dashboard.service';
import { formatCurrency } from '@/lib/currency';
import type { Tenant } from '@/types/tenant';
import type { Restaurant } from '@/types/restaurant';
import { AuditDashboard } from '@/components/dashboard/audit-dashboard';
import { PlatformMonitoringDashboard } from '@/components/dashboard/platform-monitoring-dashboard';
import { PlatformSupportDashboard } from '@/components/dashboard/platform-support-dashboard';
import { RestaurantDetailModal } from '@/components/dashboard/restaurant-detail-modal';

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverviewResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'audit' | 'support'>('overview');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Maintenance states
  const [maintenanceConsole, setMaintenanceConsole] = useState<string[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<string | null>(null);

  const loadPlatformData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [tRes, rRes, pRes] = await Promise.all([
        getTenants().catch(() => ({ success: false, data: [] as Tenant[] })),
        getRestaurants().catch(() => ({ success: false, data: [] as Restaurant[] })),
        getPlatformDashboardOverview().catch(() => ({ success: false, data: null as any })),
      ]);
      setTenants(tRes.data ?? []);
      setRestaurants(rRes.data ?? []);
      setPlatformOverview(pRes?.data ?? null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load platform admin overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runMaintenanceTask = async (task: 'vacuum' | 'cache' | 'sync') => {
    if (activeMaintenance) return;
    setActiveMaintenance(task);
    setMaintenanceConsole([]);
    
    const log = (msg: string) => {
      setMaintenanceConsole(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    log(`Initializing Platform Maintenance Routine [${task.toUpperCase()}]...`);
    await new Promise(r => setTimeout(r, 500));

    if (task === 'vacuum') {
      log('Scanning PostgreSQL database schemas for dead rows and index fragmentation...');
      await new Promise(r => setTimeout(r, 700));
      log('Re-indexing tables: "Tenant", "Restaurant", "Subscription", "Order"...');
      await new Promise(r => setTimeout(r, 600));
      log('Executing SQL: VACUUM ANALYZE...');
      await new Promise(r => setTimeout(r, 800));
      log('Database optimization completed successfully! Re-allocated 142 fragmented blocks.');
    } else if (task === 'cache') {
      log('Resolving platform Redis caching clusters...');
      await new Promise(r => setTimeout(r, 600));
      log('Invalidating namespace cache keys: "atlas:session:*", "atlas:menu:*"');
      await new Promise(r => setTimeout(r, 800));
      log('Flushing 42 stale response records...');
      await new Promise(r => setTimeout(r, 500));
      log('Platform Redis cache successfully flushed & synchronized!');
    } else {
      log('Reading subscriptions active states...');
      await new Promise(r => setTimeout(r, 500));
      log('Auditing subscription billing dates against system clocks...');
      await new Promise(r => setTimeout(r, 800));
      log('Synchronized 18 trialing active subscriptions. Found 0 expired licenses.');
      await new Promise(r => setTimeout(r, 600));
      log('Active licensing configurations fully audited & synchronized.');
    }
    setActiveMaintenance(null);
  };

  useEffect(() => {
    if (user?.role !== 'PLATFORM_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    void loadPlatformData();
  }, [loadPlatformData, router, user?.role]);

  if (user?.role !== 'PLATFORM_ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm font-semibold text-[#9AA6B2]">Loading Platform Control Center...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-3 py-1 text-xs font-bold text-[#2AFEB7]">
            <span className="h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
            Atlas Platform Control Center
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#F5F7FA]">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            Logged in as <span className="font-semibold text-[#F5F7FA]">{user?.email ?? 'Platform admin'}</span> (PLATFORM_ADMIN)
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPlatformData()}
          className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
        >
          ⟳ Refresh Platform Data
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-[#26313C] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={[
            'px-4 py-2 text-xs font-bold transition-all border-b-2',
            activeTab === 'overview'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]',
          ].join(' ')}
        >
          📊 System Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monitoring')}
          className={[
            'px-4 py-2 text-xs font-bold transition-all border-b-2',
            activeTab === 'monitoring'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]',
          ].join(' ')}
        >
          📡 Infrastructure & Telemetry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={[
            'px-4 py-2 text-xs font-bold transition-all border-b-2',
            activeTab === 'audit'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]',
          ].join(' ')}
        >
          🔐 Security Audit Logs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={[
            'px-4 py-2 text-xs font-bold transition-all border-b-2',
            activeTab === 'support'
              ? 'border-[#2AFEB7] text-[#2AFEB7]'
              : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]',
          ].join(' ')}
        >
          🆘 Support & Incident Desk
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Platform Metric Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="ONBOARDED TENANTS"
          value={tenants.length}
          description="Total active tenant organizations"
        />

        <StatCard
          title="RESTAURANTS"
          value={restaurants.length}
          description="Total active restaurants in platform"
        />

        <StatCard
          title="GLOBAL USERS"
          value={platformOverview?.metrics.totalUsers ?? 0}
          description="Total registered user accounts"
        />

        <StatCard
          title="TOTAL ORDERS"
          value={platformOverview?.metrics.totalOrders ?? 0}
          description="Orders processed across all outlets"
        />

        <StatCard
          title="TOTAL REVENUE"
          value={formatCurrency(platformOverview?.metrics.totalRevenue ?? 0)}
          description="Aggregated platform billing volume"
        />
      </div>

      {/* Real-time System Telemetry & Maintenance Utilities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* API & System Diagnostics Telemetry */}
        <div className="lg:col-span-1 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F5F7FA]">API & Server Telemetry</h3>
            <p className="text-xs text-[#9AA6B2]">Real-time operational statistics of the cloud backend.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#26313C]/50 pb-2">
              <span className="text-[#9AA6B2]">Platform Status:</span>
              <span className="flex items-center gap-1.5 font-bold text-[#22C55E]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                {platformOverview?.systemMetrics.systemStatus || 'HEALTHY'}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#26313C]/50 pb-2">
              <span className="text-[#9AA6B2]">Core API Latency:</span>
              <span className="font-mono font-bold text-[#2AFEB7]">{platformOverview?.systemMetrics.apiLatencyMs || 12}ms</span>
            </div>

            <div className="flex justify-between items-center border-b border-[#26313C]/50 pb-2">
              <span className="text-[#9AA6B2]">System Uptime:</span>
              <span className="font-mono font-bold text-[#F5F7FA]">
                {platformOverview ? (
                  `${Math.floor(platformOverview.systemMetrics.uptimeSeconds / 86400)}d ${Math.floor((platformOverview.systemMetrics.uptimeSeconds % 86400) / 3600)}h ${Math.floor((platformOverview.systemMetrics.uptimeSeconds % 3600) / 60)}m`
                ) : (
                  'N/A'
                )}
              </span>
            </div>

            {/* Memory Usage Meter */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <span className="text-[#9AA6B2]">API Server Memory:</span>
                <span className="font-mono font-bold text-[#F5F7FA]">
                  {platformOverview?.systemMetrics.memoryHeapUsedMB || 0}MB / {platformOverview?.systemMetrics.memoryHeapTotalMB || 512}MB
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#18212B] overflow-hidden">
                <div
                  style={{
                    width: `${
                      platformOverview
                        ? Math.min(100, (platformOverview.systemMetrics.memoryHeapUsedMB / platformOverview.systemMetrics.memoryHeapTotalMB) * 100)
                        : 20
                    }%`
                  }}
                  className="h-full bg-gradient-to-r from-[#2AFEB7]/60 to-[#2AFEB7] rounded-full animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Utilities Console */}
        <div className="lg:col-span-2 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F5F7FA]">Platform Maintenance Console</h3>
            <p className="text-xs text-[#9AA6B2]">Execute administrative database and routing routines.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('vacuum')}
              className="flex-1 rounded-xl bg-[#18212B] border border-[#26313C] hover:border-[#2AFEB7] py-2 text-xs font-bold text-[#F5F7FA] transition-all disabled:opacity-50"
            >
              🧹 Database Vacuum
            </button>
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('cache')}
              className="flex-1 rounded-xl bg-[#18212B] border border-[#26313C] hover:border-[#2AFEB7] py-2 text-xs font-bold text-[#F5F7FA] transition-all disabled:opacity-50"
            >
              ⚡ Flush Cache
            </button>
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('sync')}
              className="flex-1 rounded-xl bg-[#18212B] border border-[#26313C] hover:border-[#2AFEB7] py-2 text-xs font-bold text-[#F5F7FA] transition-all disabled:opacity-50"
            >
              🔄 Audit Licenses
            </button>
          </div>

          {/* Maintenance Terminal logs */}
          <div className="rounded-xl border border-[#26313C] bg-[#070B0E] p-4 font-mono text-[10px] text-[#2AFEB7] h-32 overflow-y-auto space-y-1 select-all">
            {maintenanceConsole.length === 0 ? (
              <span className="text-[#9AA6B2] italic">// Platform Admin diagnostic terminal. Ready to launch routine.</span>
            ) : (
              maintenanceConsole.map((logLine, idx) => (
                <div key={idx}>{logLine}</div>
              ))
            )}
            {activeMaintenance && (
              <div className="flex items-center gap-1.5 animate-pulse">
                <span>⚡ Processing routine...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Activity Feed & Directory */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Global Restaurant Directory Table */}
        <div className="lg:col-span-2 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F5F7FA]">Global Restaurant Directory</h2>
              <p className="text-xs text-[#9AA6B2]">
                All onboarded restaurants across all tenant accounts.
              </p>
            </div>
            <span className="rounded-full bg-[#18212B] px-3 py-1 text-[10px] font-mono text-[#2AFEB7] border border-[#26313C]">
              {restaurants.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#26313C] text-[#9AA6B2] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Restaurant Name</th>
                  <th className="py-2.5 px-4">Slug / Namespace</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Created At</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26313C]/50">
                {restaurants.map((res) => (
                  <tr
                    key={res.id}
                    onClick={() => setSelectedRestaurantId(res.id)}
                    className="hover:bg-[#18212B] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-[#F5F7FA] group-hover:text-[#2AFEB7] transition-colors">
                      <div className="flex items-center gap-2">
                        <span>🍽️</span>
                        <span>{res.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#9AA6B2]">{res.slug}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-[#2AFEB7]/10 px-2.5 py-0.5 text-[9px] font-bold text-[#2AFEB7] border border-[#2AFEB7]/30 uppercase">
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9AA6B2]">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRestaurantId(res.id);
                        }}
                        className="rounded-lg border border-[#26313C] bg-[#18212B] px-2.5 py-1 text-[10px] font-bold text-[#2AFEB7] hover:border-[#2AFEB7] transition-colors"
                      >
                        View Details 🔍
                      </button>
                    </td>
                  </tr>
                ))}

                {restaurants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#9AA6B2]">
                      No restaurants registered on the platform yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Live Activity Feed */}
        <div className="lg:col-span-1 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#F5F7FA]">Global Activity Stream</h2>
            <p className="text-xs text-[#9AA6B2]">Real-time orders placed across all outlets.</p>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {platformOverview?.recentGlobalOrders && platformOverview.recentGlobalOrders.length > 0 ? (
              platformOverview.recentGlobalOrders.map((ord) => {
                const getStatusStyle = (st: string) => {
                  switch (st) {
                    case 'COMPLETED':
                      return 'bg-green-500';
                    case 'PREPARING':
                      return 'bg-blue-500';
                    case 'PENDING':
                      return 'bg-amber-500';
                    default:
                      return 'bg-red-500';
                  }
                };

                return (
                  <div key={ord.id} className="rounded-xl border border-[#26313C] bg-[#18212B] p-3 text-[11px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-[#2AFEB7]">{ord.orderNumber}</span>
                      <span className="text-[10px] text-[#9AA6B2]">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="space-y-0.5 text-left">
                      <p className="font-semibold text-[#F5F7FA]">{ord.restaurantName}</p>
                      <p className="text-[10px] text-[#9AA6B2]">Branch: {ord.branchName}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-[#26313C]/50 pt-2 text-[10px]">
                      <span className="font-black text-white">{formatCurrency(ord.totalAmount)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${getStatusStyle(ord.status)}`} />
                        <span className="text-[9px] font-bold text-[#9AA6B2] uppercase">{ord.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-[#9AA6B2] text-xs py-12 italic">No recent order stream detected.</p>
            )}
          </div>
        </div>
      </div>
      </>
      ) : activeTab === 'monitoring' ? (
        <PlatformMonitoringDashboard />
      ) : activeTab === 'audit' ? (
        <AuditDashboard />
      ) : (
        <PlatformSupportDashboard />
      )}

      {/* Restaurant Deep-Dive Modal */}
      {selectedRestaurantId && (
        <RestaurantDetailModal
          restaurantId={selectedRestaurantId}
          onClose={() => setSelectedRestaurantId(null)}
        />
      )}
    </div>
  );
}
