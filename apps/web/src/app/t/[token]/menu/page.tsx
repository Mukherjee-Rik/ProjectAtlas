'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicCustomerMenu } from '@/types/menu';
import { getPublicCustomerMenu } from '@/services/public-tables.service';
import { getPublicOrders } from '@/services/orders.service';
import type { Order } from '@/types/order';
import { useCart } from '@/hooks/use-cart';
import { CartBar } from '@/components/customer/cart-bar';
import { MenuItemSheet } from '@/components/customer/menu-item-sheet';
import { MenuItemCard, type MenuCardItem } from '@/components/customer/menu-item-card';

export default function CustomerMenuPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [menu, setMenu] = useState<PublicCustomerMenu | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const { cart, addItem, updateQuantity, removeItem } = useCart();

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menuRes, ordersRes] = await Promise.allSettled([
        getPublicCustomerMenu(token),
        getPublicOrders(token),
      ]);

      if (menuRes.status === 'fulfilled') {
        setMenu(menuRes.value.data);
        setLoadError(null);
      } else {
        setLoadError('This menu is not available right now.');
      }

      if (ordersRes.status === 'fulfilled') {
        const rawOrders = ordersRes.value.data ?? [];
        setActiveOrders(rawOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED'));
      }
    } catch {
      setLoadError('This menu is not available right now.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-3 w-56 rounded bg-secondary" />
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 rounded-2xl bg-card" />
          ))}
        </div>
      </main>
    );
  }

  if (loadError || !menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-atlas-error/30 bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-atlas-error/10 text-2xl text-atlas-error">
            ⚠️
          </div>
          <p className="text-sm font-bold">Menu unavailable</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <Link
            href={`/t/${token}`}
            className="inline-block rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground"
          >
            Back to table
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#34D399]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {menu.menu.name}
            </span>
          </div>
          <h1 className="text-xl font-black">{menu.restaurant.name}</h1>
          <p className="text-[11px] text-muted-foreground">
            {menu.branch.name} • {menu.diningArea.name} • {menu.table.name}
          </p>
        </div>
      </header>

      {/* Active Orders Floating Pill / Banner */}
      {activeOrders.length > 0 && (
        <div className="mx-auto w-full max-w-sm px-4 pt-3">
          <Link
            href={`/t/${token}/orders`}
            className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/20 shadow-md animate-fadeIn"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>
                {activeOrders.length} Active {activeOrders.length === 1 ? 'Order' : 'Orders'} (Tokens:{' '}
                {activeOrders.map((o) => `#${o.orderNumber}`).join(', ')})
              </span>
            </span>
            <span className="text-[11px] underline shrink-0 font-extrabold">Track →</span>
          </Link>
        </div>
      )}

      {menu.categories.length > 1 && (
        <nav className="border-b border-border bg-card/60 px-4 py-3 sticky top-[81px] z-20 backdrop-blur">
          <div className="mx-auto flex w-full max-w-sm gap-2 overflow-x-auto no-scrollbar">
            {menu.categories.map((category) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                className="whitespace-nowrap rounded-full border border-border bg-secondary px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary active:scale-95"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto w-full max-w-sm space-y-6 p-4">
        {menu.categories.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
            Nothing on the menu yet. Please ask staff for assistance.
          </p>
        )}

        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span>{category.name}</span>
              <span className="h-[1px] flex-1 bg-border" />
            </h2>

            {category.items.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
                No items available in this category.
              </p>
            ) : (
              category.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={quantityByMenuItemId.get(item.id) ?? 0}
                  onOpen={handleOpenItem}
                  onQuickAdd={handleQuickAdd}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              ))
            )}
          </section>
        ))}
      </div>

      {openItemId && (
        <MenuItemSheet
          token={token}
          itemId={openItemId}
          onClose={() => setOpenItemId(null)}
          onAdded={handleAdded}
        />
      )}

      <CartBar token={token} />
    </main>
  );
}
