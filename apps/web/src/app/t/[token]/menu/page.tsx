'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { PublicCustomerMenu } from '@/types/menu';
import { getPublicCustomerMenu } from '@/services/public-tables.service';
import { getPublicOrders } from '@/services/orders.service';
import type { Order } from '@/types/order';
import { useCart } from '@/hooks/use-cart';
import { CartBar } from '@/components/customer/cart-bar';
import { MenuItemSheet } from '@/components/customer/menu-item-sheet';
import { formatCurrency } from '@/lib/currency';

const DIETARY_COLOR: Record<string, string> = {
  VEG: '#22C55E',
  VEGAN: '#22C55E',
  EGG: '#EAB308',
  NON_VEG: '#EF4444',
};

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
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);

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

  const handleQuickAdd = (item: any) => {
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
  };

  const handleIncrement = (item: any, currentQty: number) => {
    void updateQuantity(item.id, currentQty + 1);
  };

  const handleDecrement = (item: any, currentQty: number) => {
    if (currentQty <= 1) {
      void removeItem(item.id);
    } else {
      void updateQuantity(item.id, currentQty - 1);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="mx-auto w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-5 w-40 rounded bg-[#18212B]" />
          <div className="h-3 w-56 rounded bg-[#18212B]" />
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 rounded-2xl bg-[#111820]" />
          ))}
        </div>
      </main>
    );
  }

  if (loadError || !menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[#EF4444]/30 bg-[#111820] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10 text-2xl text-[#EF4444]">
            ⚠️
          </div>
          <p className="text-sm font-bold">Menu unavailable</p>
          <p className="text-xs text-[#9AA6B2]">{loadError}</p>
          <Link
            href={`/t/${token}`}
            className="inline-block rounded-xl border border-[#26313C] px-4 py-2 text-xs font-semibold text-[#9AA6B2]"
          >
            Back to table
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] pb-28 text-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#26313C] bg-[#0B0F14]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#2AFEB7] shadow-[0_0_10px_#2AFEB7]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2AFEB7]">
              {menu.menu.name}
            </span>
          </div>
          <h1 className="text-xl font-black">{menu.restaurant.name}</h1>
          <p className="text-[11px] text-[#9AA6B2]">
            {menu.branch.name} • {menu.diningArea.name} • {menu.table.name}
          </p>
        </div>
      </header>

      {/* Active Orders Floating Pill / Banner */}
      {activeOrders.length > 0 && (
        <div className="mx-auto w-full max-w-sm px-4 pt-3">
          <Link
            href={`/t/${token}/orders`}
            className="flex items-center justify-between rounded-xl border border-[#2AFEB7]/40 bg-[#2AFEB7]/10 p-2.5 text-xs font-bold text-[#2AFEB7] transition-all hover:bg-[#2AFEB7]/20 shadow-md animate-fadeIn"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
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
        <nav className="border-b border-[#26313C] bg-[#111820]/60 px-4 py-3 sticky top-[81px] z-20 backdrop-blur">
          <div className="mx-auto flex w-full max-w-sm gap-2 overflow-x-auto no-scrollbar">
            {menu.categories.map((category) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                className="whitespace-nowrap rounded-full border border-[#26313C] bg-[#18212B] px-3.5 py-1.5 text-[11px] font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7] active:scale-95"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto w-full max-w-sm space-y-6 p-4">
        {menu.categories.length === 0 && (
          <p className="rounded-xl border border-[#26313C] bg-[#111820] p-4 text-center text-xs text-[#9AA6B2]">
            Nothing on the menu yet. Please ask staff for assistance.
          </p>
        )}

        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#9AA6B2] flex items-center gap-2">
              <span>{category.name}</span>
              <span className="h-[1px] flex-1 bg-[#26313C]" />
            </h2>

            {category.items.length === 0 ? (
              <p className="rounded-xl border border-[#26313C] bg-[#111820] p-3 text-[11px] text-[#9AA6B2]">
                No items available in this category.
              </p>
            ) : (
              category.items.map((item) => {
                const cartItem = cart?.items.find((ci) => ci.menuItemId === item.id);
                const quantityInCart = cartItem?.quantity ?? 0;
                const hasCustomizations =
                  (item.variantGroups && item.variantGroups.length > 0) ||
                  (item.addonGroups && item.addonGroups.length > 0);
                const isMutating = mutatingItemId === item.id;

                return (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4 transition-all hover:border-[#2AFEB7]/30 shadow-md"
                  >
                    <div
                      onClick={() => setOpenItemId(item.id)}
                      className="cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: DIETARY_COLOR[item.dietaryType] ?? '#9AA6B2',
                              }}
                            />
                            <h3 className="text-sm font-bold leading-tight text-[#F5F7FA]">
                              {item.name}
                            </h3>
                          </div>
                          {item.description && (
                            <p className="line-clamp-2 text-[11px] leading-relaxed text-[#9AA6B2]">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#26313C]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Price + Direct Inline Quantity Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#26313C]/40">
                      <div className="flex flex-col">
                        <span className="text-base font-black text-[#2AFEB7]">
                          {formatCurrency(item.price)}
                        </span>
                        {hasCustomizations && (
                          <button
                            type="button"
                            onClick={() => setOpenItemId(item.id)}
                            className="text-[10px] text-[#9AA6B2] hover:text-[#2AFEB7] text-left underline"
                          >
                            Customisable options
                          </button>
                        )}
                      </div>

                      {quantityInCart === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#2AFEB7] bg-[#2AFEB7]/10 px-5 py-2 text-xs font-bold text-[#2AFEB7] transition-all hover:bg-[#2AFEB7] hover:text-[#0B0F14] active:scale-90 shadow-sm cursor-pointer"
                        >
                          <span>+</span> {hasCustomizations ? 'ADD' : 'ADD'}
                        </button>
                      ) : (
                        <div className="flex items-center rounded-xl border border-[#2AFEB7] bg-[#18212B] p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrement(item, quantityInCart)}
                            className="flex h-7 w-8 items-center justify-center rounded-lg text-base font-bold text-[#2AFEB7] transition-all hover:bg-[#2AFEB7]/20 active:scale-75 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="min-w-7 text-center text-xs font-bold font-mono text-[#F5F7FA]">
                            {quantityInCart}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleIncrement(item, quantityInCart)}
                            className="flex h-7 w-8 items-center justify-center rounded-lg text-base font-bold text-[#2AFEB7] transition-all hover:bg-[#2AFEB7]/20 active:scale-75 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
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
