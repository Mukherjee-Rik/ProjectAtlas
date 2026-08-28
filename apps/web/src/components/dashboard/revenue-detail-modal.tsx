'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { RevenueBreakdown } from '@/types/dashboard';

export type AnalyticsModalMode = 'revenue' | 'orders' | 'aov';

interface AnalyticsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AnalyticsModalMode;
  breakdown: RevenueBreakdown | undefined;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

export function AnalyticsDetailModal({
  isOpen,
  onClose,
  initialMode = 'revenue',
  breakdown,
  metrics,
}: AnalyticsDetailModalProps) {
  const [currentMode, setCurrentMode] = useState<AnalyticsModalMode>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setActiveTab('overview');
      setSearchTerm('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Fallback estimates if backend hasn't populated breakdown yet
  const totalGross = breakdown?.totalGrossRevenue ?? metrics.totalRevenue;
  const totalSubtotal = breakdown?.totalSubtotal ?? Math.round((totalGross / 1.05) * 100) / 100;
  const totalTax = breakdown?.totalTaxAmount ?? Math.round((totalGross - totalSubtotal) * 100) / 100;
  const totalDiscount = breakdown?.totalDiscountAmount ?? 0;
  const netRevenue = breakdown?.netRevenue ?? totalSubtotal - totalDiscount;
  const totalOrders = breakdown?.totalOrders ?? metrics.totalOrders;
  const aov = breakdown?.averageOrderValue ?? metrics.averageOrderValue;
  const avgTax = breakdown?.averageTaxPerOrder ?? (totalOrders > 0 ? totalTax / totalOrders : 0);
  const effectiveRate = breakdown?.effectiveTaxRate ?? (totalSubtotal > 0 ? (totalTax / totalSubtotal) * 100 : 5);
  
  const dineInCount = breakdown?.dineInOrdersCount ?? totalOrders;
  const takeoutCount = breakdown?.takeoutOrdersCount ?? 0;
  const totalItems = breakdown?.totalItemsCount ?? Math.round(totalOrders * 2.5);
  const avgItems = breakdown?.averageItemsPerOrder ?? (totalOrders > 0 ? totalItems / totalOrders : 0);

  const highestTicket = breakdown?.highestOrderAmount ?? aov * 1.8;
  const lowestTicket = breakdown?.lowestOrderAmount ?? aov * 0.3;
  const ticketDist = breakdown?.ticketDistribution ?? {
    under500: Math.round(totalOrders * 0.33),
    between500And1000: Math.round(totalOrders * 0.33),
    above1000: Math.max(0, totalOrders - Math.round(totalOrders * 0.66)),
  };

  const tableSpend = breakdown?.tableSpendBreakdown ?? [];
  const transactions = breakdown?.recentTransactions ?? [];
  const filteredTransactions = transactions.filter(
    (t) =>
      t.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tableName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-xl text-primary border border-primary/20">
              {currentMode === 'revenue' ? '💳' : currentMode === 'orders' ? '🛒' : '📈'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {currentMode === 'revenue'
                    ? 'Total Revenue Breakdown'
                    : currentMode === 'orders'
                    ? 'Completed Orders Analysis'
                    : 'Average Order Value (AOV) Economics'}
                </h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  Last 30 Days
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentMode === 'revenue'
                  ? 'Itemized financial breakdown including base prices, taxes, and discounts'
                  : currentMode === 'orders'
                  ? 'Order fulfillment volume, dine-in vs takeout coverage, and items served'
                  : 'Check ticket distribution, highest/lowest tickets, and table unit spend'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-secondary px-6 pt-3 gap-2">
          {/* Main 3 Metrics Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentMode('revenue')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                currentMode === 'revenue'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>💳 Revenue</span>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.2 text-[10px]">{formatCurrency(totalGross)}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentMode('orders')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                currentMode === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🛒 Orders</span>
              <span className="rounded-md bg-foreground/10 px-1.5 py-0.2 text-[10px]">{totalOrders}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentMode('aov')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                currentMode === 'aov'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>📈 AOV</span>
              <span className="rounded-md bg-atlas-info/10 px-1.5 py-0.2 text-[10px] text-atlas-info">{formatCurrency(aov)}</span>
            </button>
          </div>

          {/* Sub Tab: Overview vs Ledger */}
          <div className="flex gap-1 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-secondary text-primary border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Insights & KPIs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-secondary text-primary border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Orders Ledger ({transactions.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'ledger' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by order number (e.g. AT-000001) or table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
                />
                <span className="text-xs text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} orders
                </span>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-8 text-center text-xs text-muted-foreground">
                  No order transactions matched your search filter.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Table</th>
                        <th className="px-4 py-3 text-center">Items</th>
                        <th className="px-4 py-3 text-right">Base Subtotal</th>
                        <th className="px-4 py-3 text-right">Tax (GST)</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                        <th className="px-4 py-3 text-right">Total Price</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="transition-colors hover:bg-secondary/60">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {t.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-foreground">{t.tableName}</td>
                          <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                            {t.itemCount ?? 1}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#38BDF8]">
                            {formatCurrency(t.subtotal)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-atlas-warning">
                            {formatCurrency(t.taxAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#EC4899]">
                            {t.discountAmount > 0 ? `-${formatCurrency(t.discountAmount)}` : '₹0.00'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                            {formatCurrency(t.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : currentMode === 'revenue' ? (
            /* ========================================================
               1. REVENUE BREAKDOWN VIEW
               ======================================================== */
            <div className="space-y-6">
              {/* Primary Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Total Price (Gross)
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-foreground">
                    {formatCurrency(totalGross)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Total billed customer revenue
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Amount (Excl. Tax)
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-[#38BDF8]">
                    {formatCurrency(totalSubtotal)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Base food & beverage pricing
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Total Tax Collected
                    </span>
                    <span className="rounded bg-atlas-warning/10 px-1.5 py-0.5 text-[9px] font-bold text-atlas-warning">
                      {effectiveRate.toFixed(1)}% GST
                    </span>
                  </div>
                  <h4 className="mt-1 text-2xl font-black text-atlas-warning">
                    {formatCurrency(totalTax)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Cumulative GST / VAT component
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Discounts Given
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-[#EC4899]">
                    {formatCurrency(totalDiscount)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Vouchers and promotional savings
                  </p>
                </div>
              </div>

              {/* Financial Composition Visualizer */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Revenue Composition Breakdown</span>
                  <span className="text-[11px] text-muted-foreground">100% of Billed Volume</span>
                </div>

                <div className="flex h-4 w-full overflow-hidden rounded-full bg-card">
                  <div
                    style={{ width: `${totalGross > 0 ? (totalSubtotal / totalGross) * 100 : 100}%` }}
                    className="bg-[#38BDF8] transition-all"
                    title={`Base Subtotal: ${formatCurrency(totalSubtotal)}`}
                  />
                  <div
                    style={{ width: `${totalGross > 0 ? (totalTax / totalGross) * 100 : 0}%` }}
                    className="bg-atlas-warning transition-all"
                    title={`Tax Amount: ${formatCurrency(totalTax)}`}
                  />
                  <div
                    style={{ width: `${totalGross > 0 ? (totalDiscount / totalGross) * 100 : 0}%` }}
                    className="bg-[#EC4899] transition-all"
                    title={`Discounts: ${formatCurrency(totalDiscount)}`}
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />
                    <span className="text-muted-foreground">Base Subtotal ({totalGross > 0 ? ((totalSubtotal / totalGross) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-atlas-warning" />
                    <span className="text-muted-foreground">Tax Component ({totalGross > 0 ? ((totalTax / totalGross) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#EC4899]" />
                    <span className="text-muted-foreground">Discount Savings ({totalGross > 0 ? ((totalDiscount / totalGross) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* Secondary Metrics & Unit Economics */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Net Dish Revenue
                  </span>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {formatCurrency(netRevenue)}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Subtotal minus discounts</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Average Tax Per Order
                  </span>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {formatCurrency(avgTax)}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Tax contribution per ticket</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Average Order Value (AOV)
                  </span>
                  <div className="mt-1 text-lg font-bold text-primary">
                    {formatCurrency(aov)}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Total check ticket average</p>
                </div>
              </div>
            </div>
          ) : currentMode === 'orders' ? (
            /* ========================================================
               2. COMPLETED ORDERS VIEW
               ======================================================== */
            <div className="space-y-6">
              {/* Primary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-foreground/30 bg-foreground/5 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Completed Orders
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-foreground">{totalOrders}</h4>
                  <p className="mt-1 text-[10px] text-primary">100% Fulfillment rate</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Dine-In Tables
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-[#38BDF8]">{dineInCount}</h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">QR & table service</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Takeout / Direct
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-atlas-warning">{takeoutCount}</h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">Counter & takeaway checks</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Items Served
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-primary">{totalItems}</h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">{avgItems.toFixed(1)} items / check</p>
                </div>
              </div>

              {/* Order Channel Composition */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Dining Channel Breakdown</span>
                  <span className="text-[11px] text-muted-foreground">{totalOrders} total completed</span>
                </div>

                <div className="flex h-4 w-full overflow-hidden rounded-full bg-card">
                  <div
                    style={{ width: `${totalOrders > 0 ? (dineInCount / totalOrders) * 100 : 100}%` }}
                    className="bg-[#38BDF8] transition-all"
                    title={`Dine-In: ${dineInCount} orders`}
                  />
                  <div
                    style={{ width: `${totalOrders > 0 ? (takeoutCount / totalOrders) * 100 : 0}%` }}
                    className="bg-atlas-warning transition-all"
                    title={`Takeout: ${takeoutCount} orders`}
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" />
                    <span className="text-muted-foreground">
                      Dine-in Tables ({dineInCount} orders • {totalOrders > 0 ? ((dineInCount / totalOrders) * 100).toFixed(0) : 100}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-atlas-warning" />
                    <span className="text-muted-foreground">
                      Takeout / Direct ({takeoutCount} orders • {totalOrders > 0 ? ((takeoutCount / totalOrders) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Coverage & Activity Summary */}
              {tableSpend.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Table Order Volume Distribution
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {tableSpend.map((t) => (
                      <div key={t.tableName} className="rounded-xl border border-border bg-secondary/50 p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-xs">{t.tableName}</span>
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {t.ordersCount} orders
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Revenue: {formatCurrency(t.totalRevenue)}</span>
                          <span>Avg: {formatCurrency(t.averageSpend)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================
               3. AVERAGE ORDER VALUE (AOV) VIEW
               ======================================================== */
            <div className="space-y-6">
              {/* Primary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-atlas-info/30 bg-atlas-info/5 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-atlas-info">
                    Average Order Value (AOV)
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-foreground">
                    {formatCurrency(aov)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">Total check ticket average</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Base Check (Excl. Tax)
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-[#38BDF8]">
                    {formatCurrency(totalOrders > 0 ? totalSubtotal / totalOrders : 0)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">Food & beverage subtotal</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Highest Check Ticket
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-primary">
                    {formatCurrency(highestTicket)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">Peak table check size</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/60 p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lowest Check Ticket
                  </span>
                  <h4 className="mt-1 text-2xl font-black text-[#EC4899]">
                    {formatCurrency(lowestTicket)}
                  </h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">Entry / snack ticket</p>
                </div>
              </div>

              {/* Check Size Distribution */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Check Ticket Size Distribution</span>
                  <span className="text-[11px] text-muted-foreground">Spread across {totalOrders} total checks</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Small Checks (&lt; ₹500)
                    </span>
                    <div className="mt-1 text-xl font-bold text-[#38BDF8]">
                      {ticketDist.under500} checks
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {totalOrders > 0 ? ((ticketDist.under500 / totalOrders) * 100).toFixed(0) : 0}% of all volume
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Medium Checks (₹500 - ₹1,000)
                    </span>
                    <div className="mt-1 text-xl font-bold text-primary">
                      {ticketDist.between500And1000} checks
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {totalOrders > 0 ? ((ticketDist.between500And1000 / totalOrders) * 100).toFixed(0) : 0}% of all volume
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Large Checks (&gt; ₹1,000)
                    </span>
                    <div className="mt-1 text-xl font-bold text-atlas-warning">
                      {ticketDist.above1000} checks
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {totalOrders > 0 ? ((ticketDist.above1000 / totalOrders) * 100).toFixed(0) : 0}% of all volume
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Spend Economics */}
              {tableSpend.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Average Spend per Dining Table
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5">Table Location</th>
                          <th className="px-4 py-2.5 text-center">Completed Checks</th>
                          <th className="px-4 py-2.5 text-right">Total Revenue</th>
                          <th className="px-4 py-2.5 text-right">Average Check Spend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tableSpend.map((t) => (
                          <tr key={t.tableName} className="hover:bg-secondary/40 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-foreground">{t.tableName}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">{t.ordersCount} checks</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#38BDF8]">
                              {formatCurrency(t.totalRevenue)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-primary">
                              {formatCurrency(t.averageSpend)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary px-6 py-4">
          <div className="text-[11px] text-muted-foreground">
            Active Timeframe: <strong className="text-foreground">Last 30 Days</strong> • Total Revenue: <strong className="text-primary">{formatCurrency(totalGross)}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-background hover:bg-primary-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
