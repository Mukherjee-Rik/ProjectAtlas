'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getOrders, updateOrderStatus } from '@/services/orders.service';
import type { Order, OrderStatus } from '@/types/order';

interface KDSTicketProps {
  order: Order;
  onStatusChange: (id: string, nextStatus: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}

function KDSTicket({ order, onStatusChange, isUpdating }: KDSTicketProps) {
  const [elapsed, setElapsed] = useState(0);

  // Update timer every second
  useEffect(() => {
    const start = new Date(order.createdAt).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [order.createdAt]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Alert thresholds: amber warning at 10 mins, red critical at 20 mins
  const timerColor =
    elapsed >= 1200
      ? 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/30 animate-pulse'
      : elapsed >= 600
        ? 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30'
        : 'text-[#2AFEB7] bg-[#2AFEB7]/10 border-[#2AFEB7]/20';

  const hasCancellationRequest = order.cancellationRequests?.some(
    (cr) => cr.status === 'PENDING_REVIEW',
  );

  return (
    <div
      className={`flex flex-col rounded-xl border p-4 shadow-lg transition-all ${
        hasCancellationRequest
          ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          : 'border-[#26313C] bg-[#0F141C] hover:border-[#2AFEB7]/30'
      }`}
    >
      {/* Cancellation Warning Banner */}
      {hasCancellationRequest && (
        <div className="mb-2.5 rounded-lg bg-red-500/20 border border-red-500/40 p-2 text-center text-xs font-black text-red-400 animate-pulse">
          🚨 CANCELLATION REQUESTED — HOLD PREPARATION
        </div>
      )}

      {/* Ticket Header */}
      <div className="flex items-start justify-between border-b border-[#26313C]/50 pb-2.5">
        <div>
          <span className="font-mono text-sm font-bold tracking-wider text-[#2AFEB7]">
            {order.orderNumber}
          </span>
          <h4 className="mt-0.5 text-xs font-semibold text-[#F5F7FA]">
            {order.table?.name ?? 'Takeaway'}
          </h4>
        </div>
        <div className={`rounded px-2 py-0.5 text-[10px] font-bold border ${timerColor}`}>
          {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 py-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex items-start justify-between font-medium text-[#F5F7FA]">
              <span>
                <span className="font-bold text-[#2AFEB7]">{item.quantity}x</span> {item.name}
              </span>
            </div>
            {/* Options */}
            {item.variants.length > 0 && (
              <div className="pl-4 text-[10px] text-[#9AA6B2]">
                Size: {item.variants.map((v) => v.name).join(', ')}
              </div>
            )}
            {item.addons.length > 0 && (
              <div className="pl-4 text-[10px] text-[#9AA6B2]">
                Extra: {item.addons.map((a) => a.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ticket Action Button */}
      <div className="mt-2.5 pt-2.5 border-t border-[#26313C]/50">
        {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'PREPARING')}
            className="w-full rounded-lg bg-[#2AFEB7] py-2 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50"
          >
            Start Prep
          </button>
        ) : order.status === 'PREPARING' ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'READY')}
            className="w-full rounded-lg bg-[#A855F7] py-2 text-xs font-bold text-white transition-all hover:bg-[#9333EA] active:scale-[0.99] disabled:opacity-50"
          >
            Mark Ready
          </button>
        ) : (
          <div className="text-center text-[10px] font-semibold text-[#9AA6B2]">
            Ready for Pickup / Served
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenKDSPage() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchActiveOrders = useCallback(async () => {
    if (!currentRestaurant) return;
    try {
      const res = await getOrders();
      // Only keep orders that are in prep stages (exclude Completed/Cancelled)
      const kdsOrders = (res.data ?? []).filter((o) =>
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status),
      );
      setOrders(kdsOrders);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error(err);
      setError('KDS failed to refresh sync.');
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant]);

  // Initial load & Polling interval of 5 seconds for sub-second visual updates
  useEffect(() => {
    void fetchActiveOrders();
    const interval = setInterval(() => {
      void fetchActiveOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError('');
    try {
      await updateOrderStatus(orderId, nextStatus);
      await fetchActiveOrders();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
          🍳
        </div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Select restaurant for KDS
        </h2>
        <p className="text-sm text-[#9AA6B2]">
          Choose the restaurant workspace from the header selector to initialize the Kitchen display screen.
        </p>
      </div>
    );
  }

  // Segment tickets by columns
  const queueTickets = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingTickets = orders.filter((o) => o.status === 'PREPARING');
  const readyTickets = orders.filter((o) => o.status === 'READY');

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
      {/* KDS Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26313C] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA]">Kitchen KDS</h1>
          <p className="text-xs text-[#9AA6B2]">
            Active station: <span className="font-semibold text-[#F5F7FA]">{currentBranch?.name ?? 'Main'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded px-2.5 py-1">
              ⚠️ {error}
            </span>
          )}
          <div className="text-[10px] font-mono text-[#9AA6B2]">
            Sync: {lastRefreshed.toLocaleTimeString()}
          </div>
          <button
            type="button"
            onClick={() => void fetchActiveOrders()}
            className="rounded bg-[#18212B] border border-[#26313C] px-3 py-1.5 text-xs text-[#F5F7FA] hover:border-[#2AFEB7]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Grid Columns */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* COLUMN 1: Queue (New/Confirmed) */}
        <div className="flex flex-col rounded-2xl border border-[#26313C] bg-[#111820] p-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#26313C] pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#F5F7FA] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
              Queue ({queueTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {queueTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9AA6B2]">No pending orders.</div>
            ) : (
              queueTickets.map((o) => (
                <KDSTicket
                  key={o.id}
                  order={o}
                  onStatusChange={handleStatusChange}
                  isUpdating={updatingId === o.id}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: In Prep (Preparing) */}
        <div className="flex flex-col rounded-2xl border border-[#26313C] bg-[#111820] p-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#26313C] pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#F5F7FA] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#A855F7]" />
              In Prep ({preparingTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {preparingTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9AA6B2]">No items in preparation.</div>
            ) : (
              preparingTickets.map((o) => (
                <KDSTicket
                  key={o.id}
                  order={o}
                  onStatusChange={handleStatusChange}
                  isUpdating={updatingId === o.id}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: Ready to Serve (Ready) */}
        <div className="flex flex-col rounded-2xl border border-[#26313C] bg-[#111820] p-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#26313C] pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#F5F7FA] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              Ready to Serve ({readyTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {readyTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9AA6B2]">No ready items.</div>
            ) : (
              readyTickets.map((o) => (
                <KDSTicket
                  key={o.id}
                  order={o}
                  onStatusChange={handleStatusChange}
                  isUpdating={updatingId === o.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
