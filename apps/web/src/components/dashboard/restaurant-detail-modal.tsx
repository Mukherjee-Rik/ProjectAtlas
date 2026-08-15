'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { getAdminRestaurantDetail, type AdminRestaurantDetail } from '@/services/restaurants.service';

interface RestaurantDetailModalProps {
  restaurantId: string;
  onClose: () => void;
}

export function RestaurantDetailModal({ restaurantId, onClose }: RestaurantDetailModalProps) {
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'menus' | 'staff' | 'orders'>('overview');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    getAdminRestaurantDetail(restaurantId)
      .then((res) => {
        if (isMounted) {
          if (res.data) {
            setDetail(res.data);
          } else {
            setError('No data returned for this restaurant.');
          }
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load restaurant details');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-[#26313C] bg-[#111820] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#26313C] bg-[#18212B] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2AFEB7]/10 text-xl text-[#2AFEB7]">
              🍽️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#F5F7FA]">
                  {detail?.restaurant?.name || 'Restaurant Details'}
                </h2>
                {detail && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                      detail.restaurant.status === 'ACTIVE'
                        ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                        : 'border-[#EF4444]/40 bg-[#EF4444]/15 text-[#EF4444]'
                    }`}
                  >
                    {detail.restaurant.status}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[#9AA6B2]">
                Slug: <span className="text-[#2AFEB7]">{detail?.restaurant?.slug}</span> • Org: <span className="text-[#F5F7FA]">{detail?.tenant?.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#26313C] text-[#9AA6B2] hover:bg-[#26313C] hover:text-[#F5F7FA] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[#2AFEB7] border-t-transparent animate-spin" />
              <p className="text-xs text-[#9AA6B2] font-semibold">Fetching restaurant operational telemetry...</p>
            </div>
          </div>
        ) : error || !detail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-3xl">⚠️</div>
            <p className="text-sm font-semibold text-[#EF4444]">{error || 'Restaurant not found'}</p>
            <button
              onClick={onClose}
              className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2 text-xs font-bold text-white hover:border-[#2AFEB7]"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#26313C] bg-[#141C24] px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'border-[#2AFEB7] text-[#2AFEB7]'
                    : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
                }`}
              >
                📊 Overview & Economics
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'branches'
                    ? 'border-[#2AFEB7] text-[#2AFEB7]'
                    : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
                }`}
              >
                🏢 Branches & Tables ({detail.tables.length})
              </button>
              <button
                onClick={() => setActiveTab('menus')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'menus'
                    ? 'border-[#2AFEB7] text-[#2AFEB7]'
                    : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
                }`}
              >
                🍽️ Menus ({detail.menusSummary.totalMenuItems} items)
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'staff'
                    ? 'border-[#2AFEB7] text-[#2AFEB7]'
                    : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
                }`}
              >
                👥 Staff & Roles ({detail.usersAndPermissions.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'border-[#2AFEB7] text-[#2AFEB7]'
                    : 'border-transparent text-[#9AA6B2] hover:text-[#F5F7FA]'
                }`}
              >
                📜 Recent Orders ({detail.recentOrders.length})
              </button>
            </div>

            {/* Modal Content Panels */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: OVERVIEW & ECONOMICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Economics Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4">
                      <span className="text-[11px] font-semibold text-[#9AA6B2] uppercase">Total Sales Revenue</span>
                      <p className="mt-1 text-2xl font-black text-[#2AFEB7]">
                        {formatCurrency(detail.salesMetrics.totalSales)}
                      </p>
                      <span className="text-[10px] text-[#9AA6B2]">Lifetime billing volume</span>
                    </div>

                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4">
                      <span className="text-[11px] font-semibold text-[#9AA6B2] uppercase">Completed Orders</span>
                      <p className="mt-1 text-2xl font-black text-white">
                        {detail.salesMetrics.completedOrdersCount} / {detail.salesMetrics.totalOrdersCount}
                      </p>
                      <span className="text-[10px] text-[#22C55E] font-medium">
                        {detail.salesMetrics.totalOrdersCount > 0
                          ? `${Math.round((detail.salesMetrics.completedOrdersCount / detail.salesMetrics.totalOrdersCount) * 100)}% Fulfillment`
                          : '0% Fulfillment'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4">
                      <span className="text-[11px] font-semibold text-[#9AA6B2] uppercase">Average Order Value</span>
                      <p className="mt-1 text-2xl font-black text-amber-400">
                        {formatCurrency(detail.salesMetrics.averageOrderValue)}
                      </p>
                      <span className="text-[10px] text-[#9AA6B2]">Avg spend per check</span>
                    </div>

                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4">
                      <span className="text-[11px] font-semibold text-[#9AA6B2] uppercase">Subscription Plan</span>
                      <p className="mt-1 text-xl font-black text-white flex items-center gap-1.5">
                        <span>💎</span> {detail.subscription?.planName || 'Free Trial'}
                      </p>
                      <span className="text-[10px] font-bold text-[#2AFEB7] uppercase">
                        Status: {detail.subscription?.status || 'TRIALING'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Status Breakdown */}
                  <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-5 space-y-3">
                    <h3 className="text-sm font-bold text-[#F5F7FA]">Order Fulfillment Distribution</h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(detail.salesMetrics.ordersByStatus).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-2 rounded-xl bg-[#111820] border border-[#26313C] px-3.5 py-2"
                        >
                          <span className="text-xs font-bold text-white">{count}</span>
                          <span className="text-[10px] font-semibold text-[#9AA6B2] uppercase">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 space-y-2">
                      <h4 className="font-bold text-[#F5F7FA] uppercase tracking-wider text-[11px]">Organization & Identity</h4>
                      <div className="space-y-1.5 text-[#9AA6B2]">
                        <p><strong className="text-white">Tenant Organization:</strong> {detail.tenant?.name} ({detail.tenant?.slug})</p>
                        <p><strong className="text-white">Tenant ID:</strong> <span className="font-mono">{detail.tenant?.id}</span></p>
                        <p><strong className="text-white">Restaurant ID:</strong> <span className="font-mono">{detail.restaurant.id}</span></p>
                        <p><strong className="text-white">Registered On:</strong> {new Date(detail.restaurant.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 space-y-2">
                      <h4 className="font-bold text-[#F5F7FA] uppercase tracking-wider text-[11px]">Infrastructure Scope</h4>
                      <div className="space-y-1.5 text-[#9AA6B2]">
                        <p><strong className="text-white">Active Branches:</strong> {detail.branches.length} Location(s)</p>
                        <p><strong className="text-white">Total Dining Tables:</strong> {detail.tables.length} Tables</p>
                        <p><strong className="text-white">Active Menus:</strong> {detail.menusSummary.totalMenus} ({detail.menusSummary.totalMenuItems} Menu Items)</p>
                        <p><strong className="text-white">Support Incidents:</strong> {detail.supportTickets.length} Tickets</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BRANCHES & TABLES */}
              {activeTab === 'branches' && (
                <div className="space-y-6">
                  {detail.branches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-[#26313C] bg-[#18212B] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#26313C] pb-3">
                        <div>
                          <h3 className="font-bold text-white text-base">{b.name}</h3>
                          <p className="text-xs text-[#9AA6B2]">{b.address || 'No physical address specified'} • {b.phone || 'No phone'}</p>
                        </div>
                        <span className="text-xs font-mono text-[#2AFEB7] bg-[#2AFEB7]/10 px-2.5 py-1 rounded-lg border border-[#2AFEB7]/20">
                          {b.diningAreas.length} Dining Areas
                        </span>
                      </div>

                      {/* Dining Tables Grid */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#9AA6B2] uppercase">Registered Tables:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {detail.tables
                            .filter((t) => t.branchName === b.name)
                            .map((t) => (
                              <div
                                key={t.id}
                                className="rounded-xl border border-[#26313C] bg-[#111820] p-3 text-xs flex flex-col justify-between gap-2"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-white">{t.name}</span>
                                  <span className="text-[10px] text-[#9AA6B2] font-mono">Cap: {t.capacity}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-[#9AA6B2]">{t.diningAreaName}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                                      t.hasActiveSession
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-gray-800 text-gray-400'
                                    }`}
                                  >
                                    {t.hasActiveSession ? 'Occupied' : 'Vacant'}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: MENUS & OFFERINGS */}
              {activeTab === 'menus' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 text-center">
                      <span className="text-xs text-[#9AA6B2]">Total Menus</span>
                      <p className="text-2xl font-black text-white">{detail.menusSummary.totalMenus}</p>
                    </div>
                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 text-center">
                      <span className="text-xs text-[#9AA6B2]">Menu Categories</span>
                      <p className="text-2xl font-black text-[#2AFEB7]">{detail.menusSummary.totalCategories}</p>
                    </div>
                    <div className="rounded-xl border border-[#26313C] bg-[#18212B] p-4 text-center">
                      <span className="text-xs text-[#9AA6B2]">Total Dishes / Drinks</span>
                      <p className="text-2xl font-black text-amber-400">{detail.menusSummary.totalMenuItems}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#26313C] bg-[#18212B] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#141C24] border-b border-[#26313C] text-[#9AA6B2] uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Menu Name</th>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Categories</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#26313C]">
                        {detail.menusSummary.menus.map((m) => (
                          <tr key={m.id} className="hover:bg-[#111820]/60">
                            <td className="py-3 px-4 font-bold text-white">{m.name}</td>
                            <td className="py-3 px-4 font-mono text-[#9AA6B2]">{m.code}</td>
                            <td className="py-3 px-4 text-white">{m.categoriesCount} categories</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-bold">
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: STAFF & ROLES */}
              {activeTab === 'staff' && (
                <div className="rounded-xl border border-[#26313C] bg-[#18212B] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141C24] border-b border-[#26313C] text-[#9AA6B2] uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Org Role</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26313C]">
                      {detail.usersAndPermissions.map((u) => (
                        <tr key={u.id} className="hover:bg-[#111820]/60">
                          <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                          <td className="py-3 px-4 text-[#9AA6B2]">{u.email}</td>
                          <td className="py-3 px-4 font-semibold text-[#2AFEB7]">{u.membershipRole}</td>
                          <td className="py-3 px-4 text-white font-mono text-[11px]">{u.systemRole}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-bold">
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: RECENT ORDERS */}
              {activeTab === 'orders' && (
                <div className="rounded-xl border border-[#26313C] bg-[#18212B] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141C24] border-b border-[#26313C] text-[#9AA6B2] uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26313C]">
                      {detail.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#9AA6B2]">
                            No orders recorded for this restaurant yet.
                          </td>
                        </tr>
                      ) : (
                        detail.recentOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-[#111820]/60">
                            <td className="py-3 px-4 font-mono font-bold text-[#2AFEB7]">{o.orderNumber}</td>
                            <td className="py-3 px-4 text-white">{o.tableName}</td>
                            <td className="py-3 px-4 text-[#9AA6B2]">{o.itemsCount} items</td>
                            <td className="py-3 px-4 font-black text-white">{formatCurrency(o.totalAmount)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  o.status === 'COMPLETED'
                                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                                    : o.status === 'CANCELLED'
                                    ? 'bg-[#EF4444]/15 text-[#EF4444]'
                                    : 'bg-blue-500/15 text-blue-400'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#9AA6B2]">
                              {new Date(o.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="flex items-center justify-between border-t border-[#26313C] bg-[#18212B] px-6 py-3">
              <span className="text-xs text-[#9AA6B2]">
                Atlas Platform Admin Diagnostic View
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-[#26313C] bg-[#111820] hover:border-[#2AFEB7] px-4 py-2 text-xs font-bold text-[#F5F7FA] transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
