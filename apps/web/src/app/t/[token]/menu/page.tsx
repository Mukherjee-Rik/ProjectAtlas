'use client';

import Link from 'next/link';
import { use, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Coffee, TriangleAlert } from 'lucide-react';
import type { Order } from '@/types/order';
import { useCart } from '@/hooks/use-cart';
import { CartBar } from '@/components/customer/cart-bar';
import { MenuItemSheet } from '@/components/customer/menu-item-sheet';
import { MenuItemCard, type MenuCardItem } from '@/components/customer/menu-item-card';
import { publicMenuQuery, publicOrdersQuery } from '@/components/customer/public-queries';
import { SmartPairingRecommendations } from '@/components/ai/smart-pairing-recommendations';

export default function CustomerMenuPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const { cart, addItem, updateQuantity, removeItem } = useCart();

  // Both payloads are cached under token-scoped keys, so arriving here from the
  // splash screen, the item sheet or the cart reads what is already in memory
  // and revalidates behind the paint instead of showing the skeleton again.
  const menuQuery = useQuery(publicMenuQuery(token));
  const ordersQuery = useQuery(publicOrdersQuery(token));

  const menu = menuQuery.data ?? null;

  // The orders call is independent: a table whose order list fails to load can
  // still be shown the menu, which is what the page did before.
  const { activeOrders, isSessionSettled, settledOrderId } = useMemo(() => {
    const rawOrders: Order[] = ordersQuery.data ?? [];
    const nonCancelled = rawOrders.filter((o) => o.status !== 'CANCELLED');
    const allCompleted =
      nonCancelled.length > 0 && nonCancelled.every((o) => o.status === 'COMPLETED');

    return {
      activeOrders: nonCancelled.filter((o) => o.status !== 'COMPLETED'),
      isSessionSettled: allCompleted,
      settledOrderId: allCompleted ? nonCancelled[0].id : null,
    };
  }, [ordersQuery.data]);

  const handleAdded = useCallback(() => {
    setOpenItemId(null);
  }, []);

  // Menu item id -> quantity on its first matching cart line. Rebuilt once per
  // cart change so each card can take a plain number and skip re-rendering
  // when its own quantity has not moved.
  const quantityByMenuItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart?.items ?? []) {
      if (!map.has(line.menuItemId)) map.set(line.menuItemId, line.quantity);
    }
    return map;
  }, [cart]);

  const handleOpenItem = useCallback((itemId: string) => {
    setOpenItemId(itemId);
  }, []);

  const handleCloseItem = useCallback(() => {
    setOpenItemId(null);
  }, []);

  // Referentially stable, so a re-render does not invalidate every memoised
  // card through a fresh closure.
  const handleQuickAdd = useCallback(
    (item: MenuCardItem) => {
      const hasCustomizations =
        (item.variantGroups && item.variantGroups.length > 0) ||
        (item.addonGroups && item.addonGroups.length > 0);

      if (hasCustomizations) {
        setOpenItemId(item.id);
        return;
      }

      void addItem(
        { menuItemId: item.id, quantity: 1 },
        {
          name: item.name,
          unitPrice: item.price,
          imageUrl: item.imageUrl,
          dietaryType: item.dietaryType,
        },
      );
    },
    [addItem],
  );

  const handleIncrement = useCallback(
    (item: MenuCardItem, currentQty: number) => {
      void updateQuantity(item.id, currentQty + 1);
    },
    [updateQuantity],
  );

  const handleDecrement = useCallback(
    (item: MenuCardItem, currentQty: number) => {
      if (currentQty <= 1) {
        void removeItem(item.id);
      } else {
        void updateQuantity(item.id, currentQty - 1);
      }
    },
    [removeItem, updateQuantity],
  );

  if (menuQuery.isPending) {
    return (
      <main className="min-h-dvh bg-background p-4 text-foreground">
        <div className="mx-auto w-full max-w-sm animate-pulse space-y-4 sm:max-w-2xl">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-3 w-56 rounded bg-secondary" />
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 rounded-2xl bg-card" />
          ))}
        </div>
      </main>
    );
  }

  if (isSessionSettled) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
        <div className="relative w-full max-w-sm space-y-5 overflow-hidden rounded-2xl border border-primary/40 bg-card p-8 text-center shadow-lg">
          <div className="absolute left-0 right-0 top-0 h-1 bg-primary" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
            <Coffee className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-atlas-success/30 bg-atlas-success/15 px-3 py-1 text-xs font-bold text-atlas-success">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> Dining Session
              Completed
            </div>
            <h2 className="pt-1 text-lg font-black text-foreground">
              Thank You for Visiting Kafei!
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your dining bill for this table session has already been completed and settled. To start a new dining session, please scan the QR code at your table.
            </p>
          </div>
          {settledOrderId && (
            <Link
              href={`/t/${token}/orders/${settledOrderId}`}
              className="inline-block w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-background shadow-md transition-colors hover:bg-primary-hover"
            >
              View Paid Bill Receipt
            </Link>
          )}
          <p className="text-xs text-muted-foreground">Please come back again soon.</p>
        </div>
      </main>
    );
  }

  if (menuQuery.isError || !menu) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-atlas-error/30 bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-atlas-error/10 text-atlas-error">
            <TriangleAlert className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <p className="text-sm font-bold">Menu unavailable</p>
          <p className="text-xs text-muted-foreground">This menu is not available right now.</p>
          <Link
            href={`/t/${token}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground"
          >
            Back to table
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-[calc(8rem+env(safe-area-inset-bottom))] text-foreground">
      {/* Header and category nav stick as one block. The nav used to carry a
          hardcoded 81px offset that never matched the header's real height, so
          the top of the chips sat behind it. */}
      <div className="sticky top-0 z-30">
        <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-sm space-y-1 sm:max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {menu.menu.name}
              </span>
            </div>
            <h1 className="text-xl font-black break-words">{menu.restaurant.name}</h1>
            <p className="text-[11px] text-muted-foreground">
              {menu.branch.name} • {menu.diningArea.name} • {menu.table.name}
            </p>
          </div>
        </header>

        {menu.categories.length > 1 && (
          <nav className="border-b border-border bg-card/60 px-4 py-2 backdrop-blur">
            {/* The right-edge fade is the only cue that more categories exist:
                the scrollbar is hidden and at 320px two chips fill the row. */}
            <div className="mx-auto flex w-full max-w-sm gap-2 overflow-x-auto pr-6 no-scrollbar [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:max-w-2xl">
              {menu.categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-secondary px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Active Orders Floating Pill / Banner */}
      {activeOrders.length > 0 && (
        <div className="mx-auto w-full max-w-sm px-4 pt-3 sm:max-w-2xl">
          <Link
            href={`/t/${token}/orders`}
            className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="break-words">
                {activeOrders.length} Active {activeOrders.length === 1 ? 'Order' : 'Orders'} (Tokens:{' '}
                {activeOrders.map((o) => `#${o.orderNumber}`).join(', ')})
              </span>
            </span>
            <span className="shrink-0 text-[11px] font-extrabold underline">Track</span>
          </Link>
        </div>
      )}

      <div className="mx-auto w-full max-w-sm space-y-6 p-4 sm:max-w-2xl">
        {menu.categories.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
            Nothing on the menu yet. Please ask staff for assistance.
          </p>
        )}

        {menu.categories.map((category) => (
          // scroll-mt clears the sticky header + nav, so a category tap lands on
          // the heading rather than under it.
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="space-y-3 pt-2 scroll-mt-40"
          >
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>{category.name}</span>
              <span className="h-px flex-1 bg-border" />
            </h2>

            {category.items.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
                No items available in this category.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={quantityByMenuItemId.get(item.id) ?? 0}
                    onOpen={handleOpenItem}
                    onQuickAdd={handleQuickAdd}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {cart && cart.items.length > 0 && (
          <div className="pt-2">
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
          </div>
        )}
      </div>

      {openItemId && (
        <MenuItemSheet
          token={token}
          itemId={openItemId}
          onClose={handleCloseItem}
          onAdded={handleAdded}
        />
      )}

      <CartBar token={token} />
    </main>
  );
}
