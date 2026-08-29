'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { getAdminRestaurants, getRestaurants, type AdminRestaurantSummary } from '@/services/restaurants.service';
import { RestaurantDetailModal } from '@/components/dashboard/restaurant-detail-modal';
import { formatCurrency } from '@/lib/currency';
import type { Restaurant } from '@/types/restaurant';

export default function RestaurantsPage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [adminRestaurants, setAdminRestaurants] = useState<AdminRestaurantSummary[]>([]);
  const [tenantRestaurants, setTenantRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isPlatformAdmin) {
        const res = await getAdminRestaurants();
        setAdminRestaurants(res.data ?? []);
      } else if (currentTenant) {
        const res = await getRestaurants();
        setTenantRestaurants(res.data ?? []);
      } else {
        setTenantRestaurants([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Unable to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [isPlatformAdmin, currentTenant]);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  // Filtered restaurants
  const filteredAdminRestaurants = useMemo(() => {
    return adminRestaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tenantName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      return true;
    });
  }, [adminRestaurants, searchTerm, statusFilter]);

  const filteredTenantRestaurants = useMemo(() => {
    return tenantRestaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      return true;
    });
  }, [tenantRestaurants, searchTerm, statusFilter]);

  return (
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {isPlatformAdmin ? 'Platform-Wide Directory' : 'Organization Restaurants'}
          </div>
          <h1 className="mt-3 text-3xl font-black text-foreground">
            {isPlatformAdmin ? 'All Registered Restaurants' : 'Restaurants'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPlatformAdmin
              ? 'Comprehensive registry of all restaurants onboarded on the Kafei multi-tenant platform. Click on any restaurant to inspect deep-dive telemetry, branches, tables, staff, and sales.'
              : `Manage restaurants and branches under ${currentTenant?.name ?? 'your organization'}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={loadRestaurants}
          className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary"
        >
          ⟳ Refresh Directory
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by restaurant, slug, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary pl-9 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-primary text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({isPlatformAdmin ? adminRestaurants.length : tenantRestaurants.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-atlas-success text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'INACTIVE'
                ? 'bg-atlas-error text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading restaurant directory...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center text-atlas-error">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadRestaurants}
            className="mt-3 rounded-lg border border-atlas-error/40 px-3.5 py-1.5 text-xs text-foreground hover:bg-atlas-error/20"
          >
            Retry
          </button>
        </div>
      ) : isPlatformAdmin ? (
        /* PLATFORM ADMIN VIEW: Detailed global multi-tenant cards/table */
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Organization / Tenant</th>
                  <th className="px-6 py-4">Plan / License</th>
                  <th className="px-6 py-4">Locations & Tables</th>
                  <th className="px-6 py-4">Sales Volume</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredAdminRestaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className="transition-colors hover:bg-secondary cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        <span>🍽️</span>
                        <span>{r.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">slug: {r.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{r.tenantName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{r.tenantId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                        💎 {r.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      <div>{r.branchesCount} Branch(es)</div>
                      <div className="text-[10px] text-muted-foreground">{r.tablesCount} Tables</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground font-mono">{formatCurrency(r.totalSales)}</div>
                      <div className="text-[10px] text-atlas-success">{r.completedOrders} orders</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                          r.status === 'ACTIVE'
                            ? 'bg-atlas-success/15 text-atlas-success border-atlas-success/30'
                            : 'bg-atlas-error/15 text-atlas-error border-atlas-error/30'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRestaurantId(r.id);
                        }}
                        className="rounded-lg border border-border bg-secondary px-3 py-1 text-xs font-bold text-primary hover:border-primary transition-all"
                      >
                        Inspect Details 🔍
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAdminRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No restaurants match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TENANT VIEW */
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTenantRestaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className="transition-colors hover:bg-secondary cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors">
                      <div className="flex items-center gap-2">
                        <span>🍽️</span>
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-primary">{r.slug}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRestaurantId(r.id);
                        }}
                        className="rounded-lg border border-border bg-secondary px-3 py-1 text-xs font-bold text-primary hover:border-primary transition-all"
                      >
                        View Details 🔍
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTenantRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      No restaurants registered under this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
