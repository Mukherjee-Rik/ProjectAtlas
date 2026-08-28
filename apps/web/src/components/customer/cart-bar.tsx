'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/currency';

/**
 * Sticky cart summary shown under the menu. The badge reports distinct lines and
 * total units separately, because "2 items" and "5 units" are different numbers.
 */
export function CartBar({ token }: { token: string }) {
  const { itemCount, totalQuantity, subtotal, isLoading } = useCart();

  if (isLoading || itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur">
      <Link
        href={`/t/${token}/cart`}
        className="mx-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99]"
      >
        <span className="relative flex items-center gap-2">
          <span className="text-lg leading-none">🛒</span>
          <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-primary">
            {totalQuantity}
          </span>
        </span>

        <span className="flex flex-1 flex-col pl-3 text-left leading-tight">
          <span className="text-sm font-bold">View Cart</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} • {totalQuantity}{' '}
            {totalQuantity === 1 ? 'unit' : 'units'}
          </span>
        </span>

        <span className="text-base font-black">{formatCurrency(subtotal)}</span>
      </Link>
    </div>
  );
}
