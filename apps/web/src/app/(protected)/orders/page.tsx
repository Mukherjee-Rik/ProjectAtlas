'use client';

import { useState } from 'react';
import { ChefHat, ReceiptText, Store } from 'lucide-react';

import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import type { Order, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Badge,
  EmptyState,
  ErrorPanel,
  PageHeader,
  SkeletonTable,
  type BadgeTone,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

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

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'purple',
  READY: 'success',
  SERVED: 'mint',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
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
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Orders move constantly, so this screen refreshes in the background — but
  // only while the tab is actually visible.
  const { data: orders = [], isPending, isError, error, refetch } = useOrders({
    status: statusFilter,
    pollMs: 30_000,
  });

  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    updateStatus.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => toast.success(`Order moved to ${nextStatus.toLowerCase()}.`),
        onError: (err: unknown) =>
          toast.error(
            err instanceof Error ? err.message : 'Could not update the order status.',
          ),
      },
    );
  };

  if (!currentRestaurant) {
    return (
      <EmptyState
        icon={<Store className="h-6 w-6" aria-hidden="true" />}
        title="Select a restaurant to continue"
        description="Choose the restaurant you are currently operating in from the header selector."
      />
    );
  }

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      primary: true,
      render: (order) => (
        <div>
          <div className="font-mono text-sm font-bold text-[#2AFEB7]">{order.orderNumber}</div>
          {order.source && order.source !== 'DIRECT' && (
            <span className="mt-1.5 inline-block rounded border border-[#26313C] bg-[#18212B] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9AA6B2]">
              {order.source === 'PROVIDER_A'
                ? 'Provider A'
                : order.source === 'PROVIDER_B'
                  ? 'Provider B'
                  : order.source}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Table / Branch',
      render: (order) => (
        <div>
          <div className="text-sm text-[#F5F7FA]">{order.table?.name ?? 'Takeaway / Session'}</div>
          <div className="text-[11px] text-[#9AA6B2]">{order.branch?.name}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      hideOnMobile: true,
      cellClassName: 'max-w-xs truncate text-[#9AA6B2]',
      render: (order) => order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => (
        <span className="text-sm font-bold text-[#F5F7FA]">
          {formatCurrency(order.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <Badge tone={STATUS_TONE[order.status] ?? 'neutral'} withDot>
          {order.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      unlabelledOnMobile: true,
      render: (order) => {
        const nextAction = NEXT_STATUS[order.status];
        const isUpdating =
          updateStatus.isPending && updateStatus.variables?.orderId === order.id;

        return (
          <div
            className="flex flex-wrap items-center gap-2"
            // Keep row-level expand/collapse from firing when acting on a row.
            onClick={(e) => e.stopPropagation()}
          >
            {nextAction && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                loadingText="Updating…"
                onClick={() => handleStatusChange(order.id, nextAction.next)}
              >
                {nextAction.label}
              </Button>
            )}

            {['PENDING', 'CONFIRMED'].includes(order.status) && (
              <Button
                variant="danger"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleStatusChange(order.id, 'CANCELLED')}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Orders"
        description={
          <>
            Manage restaurant orders for{' '}
            <span className="font-semibold text-[#F5F7FA]">{currentRestaurant.name}</span>
            {currentBranch && (
              <>
                {' • '}Branch:{' '}
                <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span>
              </>
            )}
          </>
        }
      />

      {/* Filter tabs — a tablist so arrow-key navigation behaves as expected. */}
      <div
        role="tablist"
        aria-label="Filter orders by status"
        className="no-scrollbar flex touch-pan-x flex-nowrap gap-2 overflow-x-auto border-b border-[#26313C] pb-2"
      >
        {STATUSES.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(tab.value)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
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

      {isPending ? (
        <SkeletonTable rows={6} columns={5} />
      ) : isError ? (
        <ErrorPanel
          message={error instanceof Error ? error.message : 'Failed to load orders'}
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          caption="Restaurant orders"
          columns={columns}
          rows={orders}
          rowKey={(order) => order.id}
          onRowClick={(order) => setExpandedId(expandedId === order.id ? null : order.id)}
          renderExpanded={(order) =>
            expandedId === order.id ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Items
                </h3>
                <ul className="space-y-1.5">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-[#F5F7FA]">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-mono text-[#9AA6B2]">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          }
          emptyState={
            <EmptyState
              icon={
                statusFilter === 'ALL' ? (
                  <ReceiptText className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <ChefHat className="h-6 w-6" aria-hidden="true" />
                )
              }
              title="No orders found"
              description={
                statusFilter === 'ALL'
                  ? 'No orders have been placed in this restaurant yet.'
                  : `No orders are currently in "${statusFilter}" status.`
              }
            />
          }
        />
      )}
    </div>
  );
}
