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
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
              🍽️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {detail?.restaurant?.name || 'Restaurant Details'}
                </h2>
                {detail && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                      detail.restaurant.status === 'ACTIVE'
                        ? 'border-atlas-success/40 bg-atlas-success/15 text-atlas-success'
                        : 'border-atlas-error/40 bg-atlas-error/15 text-atlas-error'
                    }`}
                  >
                    {detail.restaurant.status}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Slug: <span className="text-primary">{detail?.restaurant?.slug}</span> • Org: <span className="text-foreground">{detail?.tenant?.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-border hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold">Fetching restaurant operational telemetry...</p>
            </div>
          </div>
        ) : error || !detail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-3xl">⚠️</div>
            <p className="text-sm font-semibold text-atlas-error">{error || 'Restaurant not found'}</p>
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:border-primary"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                📊 Overview & Economics
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'branches'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                🏢 Branches & Tables ({detail.tables.length})
              </button>
              <button
                onClick={() => setActiveTab('menus')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'menus'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                🍽️ Menus ({detail.menusSummary.totalMenuItems} items)
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'staff'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                👥 Staff & Roles ({detail.usersAndPermissions.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
                    <div className="rounded-xl border border-border bg-secondary p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Total Sales Revenue</span>
                      <p className="mt-1 text-2xl font-black text-primary">
                        {formatCurrency(detail.salesMetrics.totalSales)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Lifetime billing volume</span>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Completed Orders</span>
                      <p className="mt-1 text-2xl font-black text-foreground">
                        {detail.salesMetrics.completedOrdersCount} / {detail.salesMetrics.totalOrdersCount}
                      </p>
                      <span className="text-[10px] text-atlas-success font-medium">
                        {detail.salesMetrics.totalOrdersCount > 0
                          ? `${Math.round((detail.salesMetrics.completedOrdersCount / detail.salesMetrics.totalOrdersCount) * 100)}% Fulfillment`
                          : '0% Fulfillment'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Average Order Value</span>
                      <p className="mt-1 text-2xl font-black text-atlas-warning">
                        {formatCurrency(detail.salesMetrics.averageOrderValue)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Avg spend per check</span>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Subscription Plan</span>
                      <p className="mt-1 text-xl font-black text-foreground flex items-center gap-1.5">
                        <span>💎</span> {detail.subscription?.planName || 'Free Trial'}
                      </p>
                      <span className="text-[10px] font-bold text-primary uppercase">
                        Status: {detail.subscription?.status || 'TRIALING'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Status Breakdown */}
                  <div className="rounded-xl border border-border bg-secondary p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Order Fulfillment Distribution</h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(detail.salesMetrics.ordersByStatus).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-2 rounded-xl bg-card border border-border px-3.5 py-2"
                        >
                          <span className="text-xs font-bold text-foreground">{count}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-border bg-secondary p-4 space-y-2">
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Organization & Identity</h4>
                      <div className="space-y-1.5 text-muted-foreground">
                        <p><strong className="text-foreground">Tenant Organization:</strong> {detail.tenant?.name} ({detail.tenant?.slug})</p>
                        <p><strong className="text-foreground">Tenant ID:</strong> <span className="font-mono">{detail.tenant?.id}</span></p>
                        <p><strong className="text-foreground">Restaurant ID:</strong> <span className="font-mono">{detail.restaurant.id}</span></p>
                        <p><strong className="text-foreground">Registered On:</strong> {new Date(detail.restaurant.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-4 space-y-2">
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Infrastructure Scope</h4>
                      <div className="space-y-1.5 text-muted-foreground">
                        <p><strong className="text-foreground">Active Branches:</strong> {detail.branches.length} Location(s)</p>
                        <p><strong className="text-foreground">Total Dining Tables:</strong> {detail.tables.length} Tables</p>
                        <p><strong className="text-foreground">Active Menus:</strong> {detail.menusSummary.totalMenus} ({detail.menusSummary.totalMenuItems} Menu Items)</p>
                        <p><strong className="text-foreground">Support Incidents:</strong> {detail.supportTickets.length} Tickets</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BRANCHES & TABLES */}
              {activeTab === 'branches' && (
                <div className="space-y-6">
                  {detail.branches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-border bg-secondary p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                          <h3 className="font-bold text-foreground text-base">{b.name}</h3>
                          <p className="text-xs text-muted-foreground">{b.address || 'No physical address specified'} • {b.phone || 'No phone'}</p>
                        </div>
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                          {b.diningAreas.length} Dining Areas
                        </span>
                      </div>

                      {/* Dining Tables Grid */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase">Registered Tables:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {detail.tables
                            .filter((t) => t.branchName === b.name)
                            .map((t) => (
                              <div
                                key={t.id}
                                className="rounded-xl border border-border bg-card p-3 text-xs flex flex-col justify-between gap-2"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-foreground">{t.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">Cap: {t.capacity}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-muted-foreground">{t.diningAreaName}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                                      t.hasActiveSession
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-secondary text-muted-foreground'
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
                    <div className="rounded-xl border border-border bg-secondary p-4 text-center">
                      <span className="text-xs text-muted-foreground">Total Menus</span>
                      <p className="text-2xl font-black text-foreground">{detail.menusSummary.totalMenus}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary p-4 text-center">
                      <span className="text-xs text-muted-foreground">Menu Categories</span>
                      <p className="text-2xl font-black text-primary">{detail.menusSummary.totalCategories}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary p-4 text-center">
                      <span className="text-xs text-muted-foreground">Total Dishes / Drinks</span>
                      <p className="text-2xl font-black text-atlas-warning">{detail.menusSummary.totalMenuItems}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-card border-b border-border text-muted-foreground uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Menu Name</th>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Categories</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detail.menusSummary.menus.map((m) => (
                          <tr key={m.id} className="hover:bg-card/60">
                            <td className="py-3 px-4 font-bold text-foreground">{m.name}</td>
                            <td className="py-3 px-4 font-mono text-muted-foreground">{m.code}</td>
                            <td className="py-3 px-4 text-foreground">{m.categoriesCount} categories</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-atlas-success/15 text-atlas-success text-[10px] font-bold">
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
                <div className="rounded-xl border border-border bg-secondary overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-card border-b border-border text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Org Role</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.usersAndPermissions.map((u) => (
                        <tr key={u.id} className="hover:bg-card/60">
                          <td className="py-3 px-4 font-bold text-foreground">{u.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 px-4 font-semibold text-primary">{u.membershipRole}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-[11px]">{u.systemRole}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-atlas-success/15 text-atlas-success text-[10px] font-bold">
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
                <div className="rounded-xl border border-border bg-secondary overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-card border-b border-border text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No orders recorded for this restaurant yet.
                          </td>
                        </tr>
                      ) : (
                        detail.recentOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-card/60">
                            <td className="py-3 px-4 font-mono font-bold text-primary">{o.orderNumber}</td>
                            <td className="py-3 px-4 text-foreground">{o.tableName}</td>
                            <td className="py-3 px-4 text-muted-foreground">{o.itemsCount} items</td>
                            <td className="py-3 px-4 font-black text-foreground">{formatCurrency(o.totalAmount)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  o.status === 'COMPLETED'
                                    ? 'bg-atlas-success/15 text-atlas-success'
                                    : o.status === 'CANCELLED'
                                    ? 'bg-atlas-error/15 text-atlas-error'
                                    : 'bg-atlas-info/15 text-atlas-info'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
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
            <div className="flex items-center justify-between border-t border-border bg-secondary px-6 py-3">
              <span className="text-xs text-muted-foreground">
                Kafei Platform Admin Diagnostic View
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-border bg-card hover:border-primary px-4 py-2 text-xs font-bold text-foreground transition-colors"
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
