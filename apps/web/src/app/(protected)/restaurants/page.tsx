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
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-3 py-1 text-xs font-bold text-[#2AFEB7]">
            <span className="h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
            {isPlatformAdmin ? 'Platform-Wide Directory' : 'Organization Restaurants'}
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#F5F7FA]">
            {isPlatformAdmin ? 'All Registered Restaurants' : 'Restaurants'}
          </h1>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            {isPlatformAdmin
              ? 'Comprehensive registry of all restaurants onboarded on the Atlas multi-tenant platform. Click on any restaurant to inspect deep-dive telemetry, branches, tables, staff, and sales.'
              : `Manage restaurants and branches under ${currentTenant?.name ?? 'your organization'}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={loadRestaurants}
          className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
        >
          ⟳ Refresh Directory
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#26313C] bg-[#111820] p-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by restaurant, slug, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#26313C] bg-[#18212B] pl-9 pr-4 py-2 text-xs text-[#F5F7FA] placeholder-[#9AA6B2] focus:border-[#2AFEB7] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#9AA6B2]">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-[#2AFEB7] text-[#070B0E]'
                : 'bg-[#18212B] text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            All ({isPlatformAdmin ? adminRestaurants.length : tenantRestaurants.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#22C55E] text-white'
                : 'bg-[#18212B] text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'INACTIVE'
                ? 'bg-[#EF4444] text-white'
                : 'bg-[#18212B] text-[#9AA6B2] hover:text-[#F5F7FA]'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-12 text-center text-[#9AA6B2] shadow-xl">
          <div className="inline-block h-6 w-6 border-2 border-[#2AFEB7] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading restaurant directory...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadRestaurants}
            className="mt-3 rounded-lg border border-[#EF4444]/40 px-3.5 py-1.5 text-xs text-[#F5F7FA] hover:bg-[#EF4444]/20"
          >
            Retry
          </button>
        </div>
      ) : isPlatformAdmin ? (
        /* PLATFORM ADMIN VIEW: Detailed global multi-tenant cards/table */
        <div className="overflow-hidden rounded-2xl border border-[#26313C] bg-[#111820] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#26313C] bg-[#18212B] text-[#9AA6B2] uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-[#26313C]/50">
                {filteredAdminRestaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className="transition-colors hover:bg-[#18212B] cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#F5F7FA] group-hover:text-[#2AFEB7] transition-colors flex items-center gap-2">
                        <span>🍽️</span>
                        <span>{r.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#9AA6B2] mt-0.5">slug: {r.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{r.tenantName}</div>
                      <div className="text-[10px] text-[#9AA6B2] font-mono">{r.tenantId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                        💎 {r.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      <div>{r.branchesCount} Branch(es)</div>
                      <div className="text-[10px] text-[#9AA6B2]">{r.tablesCount} Tables</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-mono">{formatCurrency(r.totalSales)}</div>
                      <div className="text-[10px] text-[#22C55E]">{r.completedOrders} orders</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                          r.status === 'ACTIVE'
                            ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                            : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
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
                        className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1 text-xs font-bold text-[#2AFEB7] hover:border-[#2AFEB7] transition-all"
                      >
                        Inspect Details 🔍
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAdminRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9AA6B2]">
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
        <div className="overflow-hidden rounded-2xl border border-[#26313C] bg-[#111820] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#26313C] bg-[#18212B] text-[#9AA6B2] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26313C]">
                {filteredTenantRestaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className="transition-colors hover:bg-[#18212B] cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-[#F5F7FA] group-hover:text-[#2AFEB7] transition-colors">
                      <div className="flex items-center gap-2">
                        <span>🍽️</span>
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#2AFEB7]">{r.slug}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E] border border-[#22C55E]/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
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
                        className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1 text-xs font-bold text-[#2AFEB7] hover:border-[#2AFEB7] transition-all"
                      >
                        View Details 🔍
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTenantRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#9AA6B2]">
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
