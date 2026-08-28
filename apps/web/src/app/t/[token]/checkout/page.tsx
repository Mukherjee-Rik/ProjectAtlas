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
      <main className="min-h-screen bg-background p-4 text-foreground">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-6 w-36 rounded bg-secondary" />
          <div className="h-40 rounded-2xl bg-card" />
          <div className="h-28 rounded-2xl bg-card" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black">Review Order</h1>
            <p className="text-[11px] text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {totalQuantity}{' '}
              {totalQuantity === 1 ? 'unit' : 'units'}
            </p>
          </div>
          <Link
            href={`/t/${token}/cart`}
            className="rounded-xl border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            ← Back to Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {error && (
          <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error">
            {error}
          </div>
        )}

        {(!cart || cart.items.length === 0) && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
              🛒
            </div>
            <p className="text-sm font-bold">Your cart is empty</p>
            <p className="text-xs text-muted-foreground">
              Add items from the menu before checking out.
            </p>
            <Link
              href={`/t/${token}/menu`}
              className="inline-block rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <>
            {/* Order Items Summary */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Items
              </h2>

              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{item.quantity}x</span>
                        <h3 className="text-xs font-bold">{item.name}</h3>
                      </div>

                      {item.variants.length > 0 && (
                        <p className="pl-5 text-[11px] text-muted-foreground">
                          {item.variants.map((v) => v.name).join(' • ')}
                        </p>
                      )}

                      {item.addons.length > 0 && (
                        <ul className="pl-5 space-y-0.5">
                          {item.addons.map((a) => (
                            <li key={a.id} className="text-[11px] text-muted-foreground">
                              + {a.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <span className="text-xs font-bold text-foreground">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Summary
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Taxes & Charges</span>
                  <span className="font-semibold text-foreground">Calculated at order</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span className="text-foreground">Subtotal Amount</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handlePlaceOrder()}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating your order...' : 'PLACE ORDER'}
                </button>
              </div>

              <p className="text-center text-[10px] text-muted-foreground/70">
                By placing this order, your request will be sent directly to the kitchen.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
