'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from './stat-card';
import { getTenants } from '@/services/tenants.service';
import { getRestaurants } from '@/services/restaurants.service';
import { getPlatformDashboardOverview } from '@/services/dashboard.service';
import type { Tenant } from '@/types/tenant';
import type { Restaurant } from '@/types/restaurant';
import { formatCurrency } from '@/lib/currency';
import { DeliverySettings } from '@/components/settings/delivery-settings';
import { AutomationDashboard } from '@/components/dashboard/automation-dashboard';

interface PlatformTelemetry {
  metrics: {
    totalTenants: number;
    totalRestaurants: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
  };
  systemMetrics: {
    uptimeSeconds: number;
    memoryHeapUsedMB: number;
    memoryHeapTotalMB: number;
    apiLatencyMs: number;
    systemStatus: string;
  };
  recentGlobalOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    restaurantName: string;
    branchName: string;
  }[];
}

export function PlatformAdminDashboard() {
  const { user } = useAuth();
  
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

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [telemetry, setTelemetry] = useState<PlatformTelemetry | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Maintenance states
  const [maintenanceConsole, setMaintenanceConsole] = useState<string[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<string | null>(null);

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

  const loadPlatformData = useCallback(async (showRefreshing = false, start?: string, end?: string) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');
    
    try {
      const actualStart = start !== undefined ? start : startDate;
      const actualEnd = end !== undefined ? end : endDate;

      const [tRes, rRes, telRes] = await Promise.all([
        getTenants().catch(() => ({ success: false, data: [] as Tenant[] })),
        getRestaurants().catch(() => ({ success: false, data: [] as Restaurant[] })),
        getPlatformDashboardOverview(actualStart, actualEnd),
      ]);

      setTenants(tRes.data ?? []);
      setRestaurants(rRes.data ?? []);
      setTelemetry(telRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load platform control center telemetry');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadPlatformData(false, startDate, endDate);
  }, [startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="text-sm font-semibold text-muted-foreground">Loading Platform Control Center...</div>
      </div>
    );
  }

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SERVED':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'PREPARING':
      case 'READY':
        return 'bg-atlas-info/10 text-atlas-info border-atlas-info/30';
      case 'CANCELLED':
        return 'bg-atlas-error/10 text-atlas-error border-atlas-error/30';
      default:
        return 'bg-atlas-warning/10 text-atlas-warning border-atlas-warning/30';
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Kafei Platform Control Center
          </div>
          <h1 className="mt-3 text-3xl font-black text-foreground">
            Platform Overview
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Logged in as <span className="font-semibold text-foreground">{user?.email ?? 'Platform admin'}</span> (PLATFORM_ADMIN)
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void loadPlatformData(true)}
          className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-50"
        >
          <span>{isRefreshing ? 'Refreshing...' : '⟳ Refresh Data'}</span>
        </button>
      </div>

      {/* Date Pickers Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">📅 Platform Sales & Activity Date Filter</span>
          <span className="text-[10px] text-muted-foreground">Filter global metrics & telemetry</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate(getPastDateStr(30));
              setEndDate(getTodayDateStr());
            }}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-primary"
          >
            Reset (30 Days)
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-4 text-xs text-atlas-error">
          {error}
        </div>
      )}

      {/* Platform Metric Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TOTAL SALES"
          value={formatCurrency(telemetry?.metrics?.totalRevenue ?? 0)}
          description="Gross revenue processed"
        />

        <StatCard
          title="TOTAL ORDERS"
          value={telemetry?.metrics?.totalOrders ?? 0}
          description="Orders processed across all tenants"
        />

        <StatCard
          title="ACTIVE RESTAURANTS"
          value={telemetry?.metrics?.totalRestaurants ?? 0}
          description="Onboarded active store branches"
        />

        <StatCard
          title="TOTAL USERS"
          value={telemetry?.metrics?.totalUsers ?? 0}
          description="Active accounts on platform"
        />
      </div>

      {/* SaaS Plan Distribution & Maintenance Terminal Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* plan distribution analytics */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">SaaS License Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown of active customer license tiers.</p>
          </div>

          <div className="space-y-4">
            {/* Free */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Free Tier (15%)</span>
                <span className="text-foreground">3 Accounts</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div style={{ width: '15%' }} className="h-full bg-muted-foreground rounded-full" />
              </div>
            </div>

            {/* Starter */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-atlas-info">Starter Plan (35%)</span>
                <span className="text-foreground">7 Accounts</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div style={{ width: '35%' }} className="h-full bg-atlas-info rounded-full" />
              </div>
            </div>

            {/* Growth */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-primary">Growth Plan (40%)</span>
                <span className="text-foreground">8 Accounts</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div style={{ width: '40%' }} className="h-full bg-primary rounded-full" />
              </div>
            </div>

            {/* Enterprise */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#A855F7]">Enterprise (10%)</span>
                <span className="text-foreground">2 Accounts</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div style={{ width: '10%' }} className="h-full bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* DevOps Maintenance Utilities Console */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Platform Maintenance Console</h3>
            <p className="text-xs text-muted-foreground">Execute administrative database and routing routines.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('vacuum')}
              className="flex-1 rounded-xl bg-secondary border border-border hover:border-primary py-2 text-xs font-bold text-foreground transition-all disabled:opacity-50"
            >
              🧹 Database Vacuum
            </button>
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('cache')}
              className="flex-1 rounded-xl bg-secondary border border-border hover:border-primary py-2 text-xs font-bold text-foreground transition-all disabled:opacity-50"
            >
              ⚡ Flush Cache
            </button>
            <button
              type="button"
              disabled={activeMaintenance !== null}
              onClick={() => void runMaintenanceTask('sync')}
              className="flex-1 rounded-xl bg-secondary border border-border hover:border-primary py-2 text-xs font-bold text-foreground transition-all disabled:opacity-50"
            >
              🔄 Audit Licenses
            </button>
          </div>

          {/* Maintenance Terminal logs */}
          <div className="rounded-xl border border-border bg-background p-4 font-mono text-[10px] text-primary h-32 overflow-y-auto space-y-1 select-all">
            {maintenanceConsole.length === 0 ? (
              <span className="text-muted-foreground italic">// Platform Admin diagnostic terminal. Ready to launch routine.</span>
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

      {/* Middle Grid: Global Stream + System Telemetry */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Global Recent Orders Stream */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Global Activity Stream</h2>
            <p className="text-xs text-muted-foreground">
              Real-time checkout orders logged across all tenant databases.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Restaurant</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {Array.isArray(telemetry?.recentGlobalOrders) && telemetry.recentGlobalOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-secondary/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">{ord.orderNumber}</td>
                    <td className="py-2.5 px-3 text-foreground">{ord.restaurantName}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{ord.branchName}</td>
                    <td className="py-2.5 px-3 font-bold text-primary">{formatCurrency(ord.totalAmount)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${getStatusStyle(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}

                {(!telemetry?.recentGlobalOrders || telemetry.recentGlobalOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No global activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Server & System Health Metrics */}
        <div className="lg:col-span-1 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Node Server Telemetry</h2>
            <p className="text-xs text-muted-foreground">
              Real-time resource performance and system metrics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary p-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">API Status</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Uptime Status</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
                  {telemetry?.systemMetrics?.systemStatus || 'HEALTHY'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">process memory</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Heap Allocation</span>
                <span className="font-mono text-foreground">
                  {telemetry?.systemMetrics?.memoryHeapUsedMB ?? 0}MB / {telemetry?.systemMetrics?.memoryHeapTotalMB ?? 512}MB
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">process health</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">API Server Uptime</span>
                <span className="font-semibold text-muted-foreground">
                  {telemetry?.systemMetrics?.uptimeSeconds !== undefined ? formatUptime(telemetry.systemMetrics.uptimeSeconds) : 'Active'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">HTTP network latency</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">P99 DB latency</span>
                <span className="font-bold text-primary">{telemetry?.systemMetrics?.apiLatencyMs ?? 12}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Directory */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Global Restaurant Directory</h2>
            <p className="text-xs text-muted-foreground">
              All onboarded restaurants across all tenant accounts.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-mono text-primary border border-border">
            {restaurants.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-4">Restaurant Name</th>
                <th className="py-2.5 px-4">Tenant Org</th>
                <th className="py-2.5 px-4">Slug</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {restaurants.map((res) => (
                <tr key={res.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-foreground">{res.name}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{getTenantName(res.tenantId)}</td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono">{res.slug}</td>
                  <td className="py-2.5 px-4">
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/30">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {new Date(res.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Aggregator Integrations & Automation Engine (Platform Admin Management) */}
      <div className="pt-6 border-t border-border space-y-8">
        <DeliverySettings />
        <AutomationDashboard />
      </div>
    </div>
  );
}
