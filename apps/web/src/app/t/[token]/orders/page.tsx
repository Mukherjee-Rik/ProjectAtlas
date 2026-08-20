'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { Order } from '@/types/order';
import { getPublicOrders } from '@/services/orders.service';
import { formatCurrency } from '@/lib/currency';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-[#EAB308]/15', text: 'text-[#EAB308]', border: 'border-[#EAB308]/30' },
  CONFIRMED: { bg: 'bg-[#3B82F6]/15', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/30' },
  PREPARING: { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/30' },
  READY: { bg: 'bg-[#22C55E]/15', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' },
  SERVED: { bg: 'bg-[#2AFEB7]/15', text: 'text-[#2AFEB7]', border: 'border-[#2AFEB7]/30' },
  COMPLETED: { bg: 'bg-[#9AA6B2]/15', text: 'text-[#9AA6B2]', border: 'border-[#9AA6B2]/30' },
  CANCELLED: { bg: 'bg-[#EF4444]/15', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' },
};

export default function CustomerOrdersHistoryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await getPublicOrders(token);
      setOrders(response.data ?? []);
      setError(null);
    } catch {
      setError('Unable to load order history');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOrders(true);

    // Poll every 3 seconds for live multi-token updates
    const interval = setInterval(() => {
      void loadOrders(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const grandTotal = activeOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  return (
    <main className="min-h-screen bg-[#0B0F14] pb-8 text-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black">Your Table Orders</h1>
            <p className="text-[11px] text-[#9AA6B2]">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed during this session
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="rounded-xl border border-[#26313C] px-3 py-2 text-[11px] font-semibold text-[#2AFEB7] transition-colors hover:border-[#2AFEB7]/40 hover:bg-[#2AFEB7]/10"
          >
            + Add Items
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[0, 1].map((k) => (
              <div key={k} className="h-28 rounded-2xl bg-[#111820]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-2xl">
              🧾
            </div>
            <p className="text-sm font-bold">No orders placed yet</p>
            <p className="text-xs text-[#9AA6B2]">
              Orders created from this table will appear here in real-time.
            </p>
            <Link
              href={`/t/${token}/menu`}
              className="inline-block rounded-xl bg-[#2AFEB7] px-5 py-3 text-xs font-bold text-[#0B0F14] shadow-md hover:bg-[#22E5A4]"
            >
              Browse the Menu
            </Link>
          </div>
        )}

        {/* Session Orders Summary Header */}
        {!isLoading && orders.length > 0 && (
          <div className="rounded-2xl border border-[#2AFEB7]/30 bg-gradient-to-b from-[#18212B] to-[#111820] p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">
                Session Total ({activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'})
              </span>
              <p className="text-xl font-black text-[#2AFEB7] mt-0.5">
                {formatCurrency(grandTotal)}
              </p>
            </div>

            <Link
              href={`/t/${token}/menu`}
              className="rounded-xl bg-[#2AFEB7] px-3.5 py-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] transition-all"
            >
              + Order More
            </Link>
          </div>
        )}

        {/* Orders List with Old vs New Order Tokens */}
        {!isLoading &&
          orders.map((order, idx) => {
            const style = STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDING;
            const isOld = idx === 0 && orders.length > 1;
            const isNew = idx === orders.length - 1 && orders.length > 1;
            const orderRound = isOld
              ? 'Old Order (Round 1)'
              : isNew
              ? 'New Order (Round 2)'
              : orders.length > 1
              ? `Round ${idx + 1}`
              : 'Initial Order';

            return (
              <Link
                key={order.id}
                href={`/t/${token}/orders/${order.id}`}
                className="block space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4 transition-all hover:border-[#2AFEB7]/60 hover:shadow-[0_0_15px_rgba(42,254,183,0.1)] active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2AFEB7]">
                      {orderRound}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#9AA6B2]">Token:</span>
                      <span className="font-mono text-sm font-black text-[#F5F7FA]">
                        #{order.orderNumber}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {order.status}
                  </span>
                </div>

                {/* Items preview */}
                <div className="text-xs text-[#9AA6B2] line-clamp-2 bg-[#0B0F14]/50 p-2.5 rounded-xl border border-[#26313C]/60">
                  {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </div>

                <div className="flex items-center justify-between border-t border-[#26313C] pt-2 text-xs">
                  <span className="text-[#9AA6B2]">
                    🕒 {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-black text-[#F5F7FA] text-sm">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </Link>
            );
          })}
      </div>
    </main>
  );
}
