'use client';

import { useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { useToast } from '@/components/ui/toast';
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
      ? 'text-atlas-error bg-atlas-error/15 border-atlas-error/30 animate-pulse'
      : elapsed >= 600
        ? 'text-atlas-warning bg-atlas-warning/15 border-atlas-warning/30'
        : 'text-primary bg-primary/10 border-primary/20';

  const hasCancellationRequest = order.cancellationRequests?.some(
    (cr) => cr.status === 'PENDING_REVIEW',
  );

  return (
    <div
      className={`flex flex-col rounded-xl border p-4 transition-all ${
        hasCancellationRequest
          ? 'border-atlas-error/60 bg-atlas-error/10'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      {/* Cancellation Warning Banner */}
      {hasCancellationRequest && (
        <div className="mb-2.5 rounded-lg bg-atlas-error/15 border border-atlas-error/40 p-2 text-center text-xs font-bold text-atlas-error">
          CANCELLATION REQUESTED — HOLD PREPARATION
        </div>
      )}

      {/* Ticket Header */}
      <div className="flex items-start justify-between border-b border-border/50 pb-2.5">
        <div>
          <span className="font-mono text-sm font-bold tracking-wider text-primary">
            {order.orderNumber}
          </span>
          <h4 className="mt-0.5 text-xs font-semibold text-foreground">
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
            <div className="flex items-start justify-between font-medium text-foreground">
              <span>
                <span className="font-bold text-primary">{item.quantity}x</span> {item.name}
              </span>
            </div>
            {/* Options */}
            {item.variants.length > 0 && (
              <div className="pl-4 text-[10px] text-muted-foreground">
                Size: {item.variants.map((v) => v.name).join(', ')}
              </div>
            )}
            {item.addons.length > 0 && (
              <div className="pl-4 text-[10px] text-muted-foreground">
                Extra: {item.addons.map((a) => a.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ticket Action Button */}
      <div className="mt-2.5 pt-2.5 border-t border-border/50">
        {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'PREPARING')}
            className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-background transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
          >
            Start Prep
          </button>
        ) : order.status === 'PREPARING' ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'READY')}
            className="w-full rounded-lg bg-atlas-success py-2 text-xs font-bold text-background transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            Mark Ready
          </button>
        ) : (
          <div className="text-center text-[10px] font-semibold text-muted-foreground">
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

  // Declared before any early return — see the note on the guard below.
  const [mobileTab, setMobileTab] = useState<'QUEUE' | 'PREP' | 'READY'>('QUEUE');

  // The kitchen display refreshes every 5s while it is on screen. The hook
  // stops polling when the tab is hidden, so a KDS left open overnight no
  // longer issues ~17k needless authenticated requests.
  const {
    data: allOrders = [],
    isPending,
    isError,
    dataUpdatedAt,
    refetch,
  } = useOrders({ pollMs: 5000 });

  const updateStatus = useUpdateOrderStatus();
  const toast = useToast();

  const orders = allOrders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status),
  );

  const isLoading = isPending;
  const updatingId = updateStatus.isPending ? updateStatus.variables?.orderId : null;
  const lastRefreshed = new Date(dataUpdatedAt || Date.now());

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: nextStatus });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update ticket status.');
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">
          🍳
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Select restaurant for KDS
        </h2>
        <p className="text-sm text-muted-foreground">
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
    <div className="flex flex-col space-y-4 min-h-[calc(100vh-6rem)]">
      {/* KDS Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">Kitchen KDS</h1>
          <p className="text-xs text-muted-foreground">
            Active station: <span className="font-semibold text-foreground">{currentBranch?.name ?? 'Main'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isError && (
            <span
              role="alert"
              className="rounded border border-atlas-error/20 bg-atlas-error/10 px-2.5 py-1 text-[11px] font-semibold text-atlas-error"
            >
              KDS failed to refresh sync.
            </span>
          )}
          <div className="font-mono text-[10px] text-muted-foreground">
            Sync: {lastRefreshed.toLocaleTimeString()}
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:border-primary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Mobile-only Segment Switcher */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('QUEUE')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            mobileTab === 'QUEUE'
              ? 'bg-atlas-warning/20 text-atlas-warning border border-atlas-warning/40'
              : 'bg-card text-muted-foreground border border-border'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-atlas-warning" />
          <span>Queue ({queueTickets.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('PREP')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            mobileTab === 'PREP'
              ? 'bg-primary/20 text-primary border border-primary/40'
              : 'bg-card text-muted-foreground border border-border'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Prep ({preparingTickets.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('READY')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            mobileTab === 'READY'
              ? 'bg-atlas-success/20 text-atlas-success border border-atlas-success/40'
              : 'bg-card text-muted-foreground border border-border'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-atlas-success" />
          <span>Ready ({readyTickets.length})</span>
        </button>
      </div>

      {/* Grid Columns */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: Queue (New/Confirmed) */}
        <div className={`flex flex-col rounded-2xl border border-border bg-card p-4 ${mobileTab !== 'QUEUE' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-atlas-warning" />
              Queue ({queueTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {queueTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">No pending orders.</div>
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
        <div className={`flex flex-col rounded-2xl border border-border bg-card p-4 ${mobileTab !== 'PREP' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              In Prep ({preparingTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {preparingTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">No items in preparation.</div>
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
        <div className={`flex flex-col rounded-2xl border border-border bg-card p-4 ${mobileTab !== 'READY' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-atlas-success" />
              Ready to Serve ({readyTickets.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {readyTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">No ready items.</div>
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
