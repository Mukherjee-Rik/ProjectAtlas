'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { PublicCustomerMenu } from '@/types/menu';
import { getPublicCustomerMenu } from '@/services/public-tables.service';
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPublicCustomerMenu(token);
      setMenu(response.data);
      setLoadError(null);
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
    setAddedNotice(true);
    window.setTimeout(() => setAddedNotice(false), 2500);
  }, []);

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

      {menu.categories.length > 1 && (
        <nav className="border-b border-[#26313C] bg-[#111820]/60 px-4 py-3">
          <div className="mx-auto flex w-full max-w-sm gap-2 overflow-x-auto">
            {menu.categories.map((category) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                className="whitespace-nowrap rounded-full border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-[11px] font-semibold text-[#9AA6B2] transition-colors hover:border-[#2AFEB7]/40 hover:text-[#2AFEB7]"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto w-full max-w-sm space-y-6 p-4">
        {addedNotice && (
          <div className="rounded-xl border border-[#2AFEB7]/40 bg-[#2AFEB7]/10 p-3 text-xs font-semibold text-[#2AFEB7]">
            ✓ Added to your cart
          </div>
        )}

        {menu.categories.length === 0 && (
          <p className="rounded-xl border border-[#26313C] bg-[#111820] p-4 text-center text-xs text-[#9AA6B2]">
            Nothing on the menu yet. Please ask staff for assistance.
          </p>
        )}

        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#9AA6B2]">
              {category.name}
            </h2>

            {category.items.length === 0 ? (
              <p className="rounded-xl border border-[#26313C] bg-[#111820] p-3 text-[11px] text-[#9AA6B2]">
                No items available in this category.
              </p>
            ) : (
              category.items.map((item) => (
                <article
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-[#26313C] bg-[#111820] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: DIETARY_COLOR[item.dietaryType] ?? '#9AA6B2' }}
                        />
                        <h3 className="text-sm font-bold leading-tight">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-[#9AA6B2]">
                          {item.description}
                        </p>
                      )}
                      {(item.variantGroups.length > 0 || item.addonGroups.length > 0) && (
                        <p className="text-[10px] uppercase tracking-wider text-[#9AA6B2]/70">
                          Customisable
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-black text-[#2AFEB7]">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenItemId(item.id)}
                    className="w-full rounded-xl border border-[#2AFEB7]/40 bg-[#2AFEB7]/10 py-2.5 text-xs font-bold text-[#2AFEB7] transition-colors hover:bg-[#2AFEB7]/20"
                  >
                    View Item
                  </button>
                </article>
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
