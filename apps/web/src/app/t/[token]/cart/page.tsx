'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/currency';
import { getPublicCustomerMenu } from '@/services/public-tables.service';
import { SmartPairingRecommendations } from '@/components/ai/smart-pairing-recommendations';

const MAX_QUANTITY = 99;

export default function CustomerCartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [menu, setMenu] = useState<any>(null);
  const {
    cart,
    itemCount,
    totalQuantity,
    subtotal,
    isLoading,
    isMutating,
    error,
    updateQuantity,
    removeItem,
    addItem,
  } = useCart();

  useEffect(() => {
    getPublicCustomerMenu(token)
      .then((res) => {
        if (res.data) setMenu(res.data);
      })
      .catch((err) => {
        console.warn('Failed to load menu for upsell pairings', err);
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black">Your Cart</h1>
            <p className="text-[11px] text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {totalQuantity}{' '}
              {totalQuantity === 1 ? 'unit' : 'units'}
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="rounded-xl border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            + Add more
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[0, 1].map((key) => (
              <div key={key} className="h-28 rounded-2xl bg-card" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error">
            {error}
          </div>
        )}

        {!isLoading && cart && cart.items.length === 0 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
              🛒
            </div>
            <p className="text-sm font-bold">Your cart is empty</p>
            <p className="text-xs text-muted-foreground">
              Add something from the menu and it will show up here.
            </p>
            <Link
              href={`/t/${token}/menu`}
              className="inline-block rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-background"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {!isLoading &&
          cart?.items.map((item) => (
            <article
              key={item.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h2 className="text-sm font-bold leading-tight">{item.name}</h2>

                  {item.variants.length > 0 && (
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {item.variants.map((variant) => variant.name).join(' • ')}
                    </p>
                  )}

                  {item.addons.length > 0 && (
                    <ul className="space-y-0.5">
                      {item.addons.map((addon) => (
                        <li key={addon.id} className="text-[11px] text-muted-foreground">
                          + {addon.name}
                          {addon.price > 0 ? ` (${formatCurrency(addon.price)})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="pt-1 text-sm font-bold text-primary">
                    {formatCurrency(item.unitPrice)}
                    <span className="pl-1 text-[10px] font-normal text-muted-foreground">each</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-all hover:border-atlas-error/40 hover:text-atlas-error active:scale-95 cursor-pointer"
                >
                  Remove
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={item.quantity <= 1}
                    onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-border text-sm font-bold transition-all hover:border-primary/40 active:scale-75 disabled:opacity-30 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold font-mono">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={item.quantity >= MAX_QUANTITY}
                    onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-border text-sm font-bold transition-all hover:border-primary/40 active:scale-75 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <span className="text-base font-black">{formatCurrency(item.totalPrice)}</span>
              </div>
            </article>
          ))}

        {!isLoading && cart && cart.items.length > 0 && menu && (
          <SmartPairingRecommendations
            activeMenu={menu}
            cartItems={cart.items}
            onAddPairing={(item) => {
              void addItem(
                { menuItemId: item.id, quantity: 1 },
                {
                  name: item.name,
                  unitPrice: item.price,
                  imageUrl: item.imageUrl,
                  dietaryType: item.dietaryType,
                },
              );
            }}
          />
        )}

        {!isLoading && cart && cart.items.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Subtotal
              </span>
              <span className="text-xl font-black text-primary">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-[10px] leading-relaxed text-muted-foreground/70">
              Taxes and charges are applied when your order is placed.
            </p>

            <button
              type="button"
              onClick={() => router.push(`/t/${token}/checkout`)}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99]"
            >
              Continue to Checkout →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
