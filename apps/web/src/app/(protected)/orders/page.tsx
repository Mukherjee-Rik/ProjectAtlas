'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getOrders, updateOrderStatus } from '@/services/orders.service';
import type { Order, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/lib/currency';

const STATUSES: { label: string; value: 'ALL' | OrderStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Served', value: 'SERVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-[#EAB308]/15', text: 'text-[#EAB308]', border: 'border-[#EAB308]/30' },
  CONFIRMED: { bg: 'bg-[#3B82F6]/15', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30' },
  PREPARING: { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  READY: { bg: 'bg-[#22C55E]/15', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' },
  SERVED: { bg: 'bg-[#2AFEB7]/15', text: 'text-[#2AFEB7]', border: 'border-[#2AFEB7]/30' },
  COMPLETED: { bg: 'bg-[#9AA6B2]/15', text: 'text-[#9AA6B2]', border: 'border-[#9AA6B2]/30' },
  CANCELLED: { bg: 'bg-[#EF4444]/15', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' },
};

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: 'CONFIRMED', label: 'Confirm' },
  CONFIRMED: { next: 'PREPARING', label: 'Start Prep' },
  PREPARING: { next: 'READY', label: 'Mark Ready' },
  READY: { next: 'SERVED', label: 'Serve' },
  SERVED: { next: 'COMPLETED', label: 'Complete' },
};

export default function AdminOrdersPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentRestaurant) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const filter = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await getOrders(filter);
      setOrders(res.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
          🍽️
        </div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Select a restaurant to continue
        </h2>
        <p className="text-sm text-[#9AA6B2]">
          Choose the restaurant you are currently operating in from the header selector.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">Orders</h1>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Manage restaurant orders for{' '}
            <span className="font-semibold text-[#F5F7FA]">{currentRestaurant.name}</span>
            {currentBranch && (
              <>
                {' '}
                • Branch: <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span>
              </>
            )}
            .
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#26313C] pb-2">
        {STATUSES.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#2AFEB7] text-[#0B0F14]'
                  : 'border border-[#26313C] bg-[#111820] text-[#9AA6B2] hover:border-[#2AFEB7]/40 hover:text-[#F5F7FA]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading orders...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]">
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-16 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-3xl">
            🧾
          </div>
          <h2 className="text-lg font-bold text-[#F5F7FA]">No orders found</h2>
          <p className="text-sm text-[#9AA6B2]">
            {statusFilter === 'ALL'
              ? 'No orders have been placed in this restaurant yet.'
              : `No orders currently in "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="border-b border-[#26313C] bg-[#18212B]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Order #
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Table / Branch
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Items Summary
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Total
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#26313C]">
                {orders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.PENDING;
                  const nextAction = NEXT_STATUS[order.status];
                  const isExpanded = expandedId === order.id;

                  return (
                    <tbody key={order.id} className="divide-y divide-[#26313C]">
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="cursor-pointer transition-colors hover:bg-[#18212B]"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-bold text-[#2AFEB7]">
                          <div>{order.orderNumber}</div>
                          {order.source && order.source !== 'DIRECT' && (
                            <span className="mt-1.5 inline-block rounded bg-[#18212B] border border-[#26313C] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9AA6B2]">
                              {order.source === 'PROVIDER_A' ? '🚚 Provider A' : order.source === 'PROVIDER_B' ? '🛵 Provider B' : order.source}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-[#F5F7FA]">
                          <div>{order.table?.name ?? 'Takeaway / Session'}</div>
                          <div className="text-[11px] text-[#9AA6B2]">{order.branch?.name}</div>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#9AA6B2] max-w-xs truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-[#F5F7FA]">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </td>

                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {nextAction && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => void handleStatusChange(order.id, nextAction.next)}
                                className="rounded-lg bg-[#2AFEB7] px-3 py-1 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-40"
                              >
                                {updatingId === order.id ? 'Updating…' : nextAction.label}
                              </button>
                            )}

                            {['PENDING', 'CONFIRMED'].includes(order.status) && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => void handleStatusChange(order.id, 'CANCELLED')}
                                className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/20 disabled:opacity-40"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Order Breakdown */}
                      {isExpanded && (
                        <tr className="bg-[#18212B]/40">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-3 rounded-lg border border-[#26313C] bg-[#0B0F14] p-4 text-xs">
                              <h4 className="font-bold uppercase tracking-wider text-[#9AA6B2]">
                                Detailed Order Breakdown — {order.orderNumber}
                              </h4>

                              <div className="space-y-2 divide-y divide-[#26313C]">
                                {order.items.map((item) => (
                                  <div key={item.id} className="pt-2 first:pt-0 flex justify-between">
                                    <div>
                                      <span className="font-bold text-[#2AFEB7]">{item.quantity}x </span>
                                      <span className="font-bold text-[#F5F7FA]">{item.name}</span>
                                      {item.variants.length > 0 && (
                                        <span className="text-[#9AA6B2]"> ({item.variants.map((v) => v.name).join(', ')})</span>
                                      )}
                                      {item.addons.length > 0 && (
                                        <div className="text-[11px] text-[#9AA6B2] pl-4">
                                          Addons: {item.addons.map((a) => a.name).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="font-semibold text-[#F5F7FA]">
                                      {formatCurrency(item.totalPrice)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-[#26313C] pt-2 flex justify-between font-bold text-xs text-[#F5F7FA]">
                                <span>Subtotal: {formatCurrency(order.subtotal)} | Tax: {formatCurrency(order.taxAmount)}</span>
                                <span className="text-[#2AFEB7]">Total: {formatCurrency(order.totalAmount)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
