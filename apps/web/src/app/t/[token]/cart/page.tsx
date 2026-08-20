'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/currency';

const MAX_QUANTITY = 99;

export default function CustomerCartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { cart, itemCount, totalQuantity, subtotal, isLoading, isMutating, error, updateQuantity, removeItem } =
    useCart();

  return (
    <main className="min-h-screen bg-[#0B0F14] pb-8 text-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black">Your Cart</h1>
            <p className="text-[11px] text-[#9AA6B2]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {totalQuantity}{' '}
              {totalQuantity === 1 ? 'unit' : 'units'}
            </p>
          </div>
          <Link
            href={`/t/${token}/menu`}
            className="rounded-xl border border-[#26313C] px-3 py-2 text-[11px] font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]"
          >
            + Add more
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-4 p-4">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[0, 1].map((key) => (
              <div key={key} className="h-28 rounded-2xl bg-[#111820]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        {!isLoading && cart && cart.items.length === 0 && (
          <div className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-2xl">
              🛒
            </div>
            <p className="text-sm font-bold">Your cart is empty</p>
            <p className="text-xs text-[#9AA6B2]">
              Add something from the menu and it will show up here.
            </p>
            <Link
              href={`/t/${token}/menu`}
              className="inline-block rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-xs font-bold text-[#0B0F14]"
            >
              Browse the menu
            </Link>
          </div>
        )}

        {!isLoading &&
          cart?.items.map((item) => (
            <article
              key={item.id}
              className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h2 className="text-sm font-bold leading-tight">{item.name}</h2>

                  {item.variants.length > 0 && (
                    <p className="text-[11px] font-semibold text-[#9AA6B2]">
                      {item.variants.map((variant) => variant.name).join(' • ')}
                    </p>
                  )}

                  {item.addons.length > 0 && (
                    <ul className="space-y-0.5">
                      {item.addons.map((addon) => (
                        <li key={addon.id} className="text-[11px] text-[#9AA6B2]">
                          + {addon.name}
                          {addon.price > 0 ? ` (${formatCurrency(addon.price)})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="pt-1 text-sm font-bold text-[#2AFEB7]">
                    {formatCurrency(item.unitPrice)}
                    <span className="pl-1 text-[10px] font-normal text-[#9AA6B2]">each</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-lg border border-[#26313C] px-2.5 py-1 text-[11px] text-[#9AA6B2] transition-all hover:border-[#EF4444]/40 hover:text-[#EF4444] active:scale-95 cursor-pointer"
                >
                  Remove
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-[#26313C] pt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={item.quantity <= 1}
                    onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-[#26313C] text-sm font-bold transition-all hover:border-[#2AFEB7]/40 active:scale-75 disabled:opacity-30 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold font-mono">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={item.quantity >= MAX_QUANTITY}
                    onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-[#26313C] text-sm font-bold transition-all hover:border-[#2AFEB7]/40 active:scale-75 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <span className="text-base font-black">{formatCurrency(item.totalPrice)}</span>
              </div>
            </article>
          ))}

        {!isLoading && cart && cart.items.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                Subtotal
              </span>
              <span className="text-xl font-black text-[#2AFEB7]">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-[10px] leading-relaxed text-[#9AA6B2]/70">
              Taxes and charges are applied when your order is placed.
            </p>

            <button
              type="button"
              onClick={() => router.push(`/t/${token}/checkout`)}
              className="w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
            >
              Continue to Checkout →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
