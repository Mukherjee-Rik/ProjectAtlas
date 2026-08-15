'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { createPublicOrder } from '@/services/orders.service';
import { formatCurrency } from '@/lib/currency';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { cart, itemCount, totalQuantity, subtotal, isLoading, refreshCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (isSubmitting || !cart || cart.items.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createPublicOrder(token, { cartId: cart.id });
      const order = response.data;

      // Refresh cart state so cart counter drops to 0 (3.26.29)
      await refreshCart();

      // Redirect to Order Placed Success page
      router.push(`/t/${token}/orders/${order.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-6 w-36 rounded bg-[#18212B]" />
          <div className="h-40 rounded-2xl bg-[#111820]" />
          <div className="h-28 rounded-2xl bg-[#111820]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] pb-8 text-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black">Review Order</h1>
            <p className="text-[11px] text-[#9AA6B2]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {totalQuantity}{' '}
              {totalQuantity === 1 ? 'unit' : 'units'}
            </p>
          </div>
          <Link
            href={`/t/${token}/cart`}
            className="rounded-xl border border-[#26313C] px-3 py-2 text-[11px] font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]"
          >
            ← Back to Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        {(!cart || cart.items.length === 0) && (
          <div className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-2xl">
              🛒
            </div>
            <p className="text-sm font-bold">Your cart is empty</p>
            <p className="text-xs text-[#9AA6B2]">
              Add items from the menu before checking out.
            </p>
            <Link
              href={`/t/${token}/menu`}
              className="inline-block rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-xs font-bold text-[#0B0F14]"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <>
            {/* Order Items Summary */}
            <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                Order Items
              </h2>

              <div className="divide-y divide-[#26313C]">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2AFEB7]">{item.quantity}x</span>
                        <h3 className="text-xs font-bold">{item.name}</h3>
                      </div>

                      {item.variants.length > 0 && (
                        <p className="pl-5 text-[11px] text-[#9AA6B2]">
                          {item.variants.map((v) => v.name).join(' • ')}
                        </p>
                      )}

                      {item.addons.length > 0 && (
                        <ul className="pl-5 space-y-0.5">
                          {item.addons.map((a) => (
                            <li key={a.id} className="text-[11px] text-[#9AA6B2]">
                              + {a.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <span className="text-xs font-bold text-[#F5F7FA]">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                Payment Summary
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#9AA6B2]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#F5F7FA]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#9AA6B2]">
                  <span>Estimated Taxes & Charges</span>
                  <span className="font-semibold text-[#F5F7FA]">Calculated at order</span>
                </div>
                <div className="flex justify-between border-t border-[#26313C] pt-2 text-sm font-bold">
                  <span className="text-[#F5F7FA]">Subtotal Amount</span>
                  <span className="text-[#2AFEB7]">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handlePlaceOrder()}
                  className="w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating your order...' : 'PLACE ORDER'}
                </button>
              </div>

              <p className="text-center text-[10px] text-[#9AA6B2]/70">
                By placing this order, your request will be sent directly to the kitchen.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
