'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { useToast } from '@/components/ui/toast';
import type { Order, OrderStatus } from '@/types/order';

/**
 * One clock for the whole rail.
 *
 * Each ticket used to own a `setInterval` that wrote its own elapsed-seconds
 * state, so a busy pass with thirty tickets re-rendered thirty components a
 * second on thirty unsynchronised phases and the display visibly stuttered.
 * A single tick at the page level re-renders the tree once and every ticket
 * derives its own elapsed time from the shared timestamp.
 *
 * Starts at 0 rather than `Date.now()` so the server-rendered markup and the
 * first client render agree; the effect fills it in on mount.
 */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

interface KDSTicketProps {
  order: Order;
  now: number;
  onStatusChange: (id: string, nextStatus: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}

function KDSTicket({ order, now, onStatusChange, isUpdating }: KDSTicketProps) {
  const elapsed = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 1000));

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
          <h4 className="mt-0.5 text-sm font-semibold text-foreground">
            {order.table?.name ?? 'Takeaway'}
          </h4>
        </div>
        <div className={`rounded border px-2 py-0.5 text-xs font-bold tabular-nums ${timerColor}`}>
          {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 py-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="text-sm sm:text-base">
            <div className="flex items-start justify-between font-medium text-foreground">
              <span>
                <span className="font-bold text-primary">{item.quantity}x</span> {item.name}
              </span>
            </div>
            {/* Options. Modifiers are the most error-prone line on a ticket, so
                they are read at body size rather than as a muted hint. */}
            {item.variants.length > 0 && (
              <div className="pl-4 text-xs font-medium text-foreground">
                Size: {item.variants.map((v) => v.name).join(', ')}
              </div>
            )}
            {item.addons.length > 0 && (
              <div className="pl-4 text-xs font-medium text-foreground">
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
            className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-background transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
          >
            Start Prep
          </button>
        ) : order.status === 'PREPARING' ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'READY')}
            className="w-full rounded-lg bg-atlas-success py-2 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            Mark Ready
          </button>
        ) : (
          <div className="text-center text-xs font-semibold text-muted-foreground">
            Ready for Pickup / Served
          </div>
        )}
      </div>
    </div>
  );
}

interface KDSColumnProps {
  title: string;
  dotClassName: string;
  tickets: Order[];
  emptyLabel: string;
  isLoading: boolean;
  hiddenOnMobile: boolean;
  now: number;
  updatingId: string | null | undefined;
  onStatusChange: (id: string, nextStatus: OrderStatus) => Promise<void>;
}

function KDSColumn({
  title,
  dotClassName,
  tickets,
  emptyLabel,
  isLoading,
  hiddenOnMobile,
  now,
  updatingId,
  onStatusChange,
}: KDSColumnProps) {
  return (
    <div
      className={`min-h-0 flex-col rounded-2xl border border-border bg-card p-4 ${
        hiddenOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
          <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
          {title} ({tickets.length})
        </h3>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {isLoading ? (
          // An empty column and a column that has not loaded yet look the same
          // to a cook, and one of those means "you are missing orders".
          <div className="space-y-4" aria-label={`Loading ${title} tickets`} aria-busy="true">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">{emptyLabel}</div>
        ) : (
          tickets.map((o) => (
            <KDSTicket
              key={o.id}
              order={o}
              now={now}
              onStatusChange={onStatusChange}
              isUpdating={updatingId === o.id}
            />
          ))
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
  const now = useNow(1000);

  // Segmenting runs once per data change rather than once per clock tick.
  const { queueTickets, preparingTickets, readyTickets } = useMemo(() => {
    const active = allOrders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status),
    );
    return {
      queueTickets: active.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED'),
      preparingTickets: active.filter((o) => o.status === 'PREPARING'),
      readyTickets: active.filter((o) => o.status === 'READY'),
    };
  }, [allOrders]);

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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ChefHat className="h-6 w-6" />
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

  return (
    // The rail is a fixed-height column, not a growing document: `dvh` so the
    // mobile URL bar does not push the last ticket below the fold, and
    // `overflow-hidden` so the three ticket lists scroll inside themselves and
    // the column headers stay put.
    <div className="flex h-[calc(100dvh-6rem)] flex-col space-y-4 overflow-hidden">
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

      {/* Grid Columns. `min-h-0` on the grid and on each column is what lets
          the ticket lists scroll: a flex/grid item defaults to min-height:auto
          and refuses to shrink below its content, which pushed the headers off
          the top of a wall-mounted screen. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
        <KDSColumn
          title="Queue"
          dotClassName="bg-atlas-warning"
          tickets={queueTickets}
          emptyLabel="No pending orders."
          isLoading={isLoading}
          hiddenOnMobile={mobileTab !== 'QUEUE'}
          now={now}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
        />

        <KDSColumn
          title="In Prep"
          dotClassName="bg-primary"
          tickets={preparingTickets}
          emptyLabel="No items in preparation."
          isLoading={isLoading}
          hiddenOnMobile={mobileTab !== 'PREP'}
          now={now}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
        />

        <KDSColumn
          title="Ready to Serve"
          dotClassName="bg-atlas-success"
          tickets={readyTickets}
          emptyLabel="No ready items."
          isLoading={isLoading}
          hiddenOnMobile={mobileTab !== 'READY'}
          now={now}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
