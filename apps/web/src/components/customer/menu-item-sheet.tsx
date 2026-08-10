'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicCustomerMenuItemDetail } from '@/types/menu';
import { getPublicCustomerMenuItem } from '@/services/public-tables.service';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/currency';

const MAX_QUANTITY = 99;

const DIETARY_COLOR: Record<string, string> = {
  VEG: '#22C55E',
  VEGAN: '#22C55E',
  EGG: '#EAB308',
  NON_VEG: '#EF4444',
};

export function MenuItemSheet({
  token,
  itemId,
  onClose,
  onAdded,
}: {
  token: string;
  itemId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { addItem, isMutating, error, clearError } = useCart();

  const [detail, setDetail] = useState<PublicCustomerMenuItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Variant groups are single-select, so one chosen variant id per group.
  const [variantByGroup, setVariantByGroup] = useState<Record<string, string>>({});
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      clearError();
      try {
        // Re-read the item on open: a page left open on the table may be showing
        // something the restaurant has since deactivated.
        const response = await getPublicCustomerMenuItem(token, itemId);
        if (cancelled) return;
        setDetail(response.data);
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError('This item is no longer available.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, itemId, clearError]);

  const item = detail?.item;
  const variantIds = useMemo(() => Object.values(variantByGroup), [variantByGroup]);

  const unitPreview = useMemo(() => {
    if (!item) return 0;
    const variantTotal = (item.variantGroups ?? [])
      .flatMap((group) => group.variants)
      .filter((variant) => variantIds.includes(variant.id))
      .reduce((sum, variant) => sum + variant.price, 0);
    const addonTotal = (item.addonGroups ?? [])
      .flatMap((group) => group.addons)
      .filter((addon) => addonIds.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return item.price + variantTotal + addonTotal;
  }, [item, variantIds, addonIds]);

  const missingRequired = useMemo(() => {
    if (!item) return true;
    const variantMissing = (item.variantGroups ?? []).some(
      (group) => group.required && !variantByGroup[group.id],
    );
    const addonMissing = (item.addonGroups ?? []).some((group) => {
      const selected = group.addons.filter((addon) => addonIds.includes(addon.id)).length;
      const minimum = group.required ? Math.max(group.minSelect, 1) : group.minSelect;
      if (selected === 0 && !group.required) return false;
      return selected < minimum;
    });
    return variantMissing || addonMissing;
  }, [item, variantByGroup, addonIds]);

  const toggleAddon = useCallback((groupMaxSelect: number, groupAddonIds: string[], addonId: string) => {
    setAddonIds((current) => {
      if (current.includes(addonId)) return current.filter((id) => id !== addonId);
      const selectedInGroup = current.filter((id) => groupAddonIds.includes(id));
      if (selectedInGroup.length >= groupMaxSelect) return current;
      return [...current, addonId];
    });
  }, []);

  const handleAdd = useCallback(async () => {
    if (!item) return;
    try {
      // Only ids and quantity travel to the API — the price is the server's business.
      await addItem({ menuItemId: item.id, quantity, variantIds, addonIds });
      onAdded();
    } catch {
      // The hook surfaces the message; the sheet stays open so it can be fixed.
    }
  }, [item, quantity, variantIds, addonIds, addItem, onAdded]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-[#26313C] bg-[#111820] text-[#F5F7FA] shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#26313C] bg-[#111820] p-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold leading-tight">
              {item?.name ?? (loadError ? 'Unavailable' : 'Loading…')}
            </h2>
            {item?.category?.name && (
              <p className="text-[10px] uppercase tracking-wider text-[#9AA6B2]">
                {item.category.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-[#26313C] px-2 py-1 text-xs text-[#9AA6B2] transition-colors hover:text-[#F5F7FA]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4">
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-2/3 rounded bg-[#18212B]" />
              <div className="h-3 w-1/2 rounded bg-[#18212B]" />
              <div className="h-20 rounded-xl bg-[#18212B]" />
            </div>
          )}

          {loadError && (
            <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {loadError}
            </div>
          )}

          {item && (
            <>
              <div className="space-y-2">
                {item.description && (
                  <p className="text-xs leading-relaxed text-[#9AA6B2]">{item.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DIETARY_COLOR[item.dietaryType] ?? '#9AA6B2' }}
                  />
                  <span className="text-sm font-bold text-[#2AFEB7]">
                    {formatCurrency(item.price)}
                  </span>
                  {item.preparationTimeMinutes ? (
                    <span className="text-[10px] text-[#9AA6B2]">
                      • {item.preparationTimeMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>

              {(item.variantGroups ?? []).map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F7FA]">
                      {group.name}
                    </h3>
                    <span className="text-[10px] text-[#9AA6B2]">
                      {group.required ? 'Required • pick 1' : 'Optional • pick 1'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.variants.map((variant) => {
                      const selected = variantByGroup[group.id] === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() =>
                            setVariantByGroup((current) => ({ ...current, [group.id]: variant.id }))
                          }
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                            selected
                              ? 'border-[#2AFEB7] bg-[#2AFEB7]/10 text-[#2AFEB7]'
                              : 'border-[#26313C] bg-[#18212B] text-[#F5F7FA] hover:border-[#2AFEB7]/40'
                          }`}
                        >
                          <span className="font-semibold">{variant.name}</span>
                          <span>{variant.price > 0 ? `+ ${formatCurrency(variant.price)}` : '—'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {(item.addonGroups ?? []).map((group) => {
                const groupAddonIds = group.addons.map((addon) => addon.id);
                const selectedInGroup = addonIds.filter((id) => groupAddonIds.includes(id)).length;
                const atMax = selectedInGroup >= group.maxSelect;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F7FA]">
                        {group.name}
                      </h3>
                      <span className="text-[10px] text-[#9AA6B2]">
                        {group.required ? 'Required' : 'Optional'} • max {group.maxSelect}
                        {group.minSelect > 0 ? ` • min ${group.minSelect}` : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.addons.map((addon) => {
                        const selected = addonIds.includes(addon.id);
                        const disabled = !selected && atMax;
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleAddon(group.maxSelect, groupAddonIds, addon.id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                              selected
                                ? 'border-[#2AFEB7] bg-[#2AFEB7]/10 text-[#2AFEB7]'
                                : 'border-[#26313C] bg-[#18212B] text-[#F5F7FA] hover:border-[#2AFEB7]/40'
                            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            <span className="font-semibold">
                              {selected ? '✓ ' : '+ '}
                              {addon.name}
                            </span>
                            <span>{addon.price > 0 ? `+ ${formatCurrency(addon.price)}` : '—'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between rounded-xl border border-[#26313C] bg-[#18212B] p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-lg border border-[#26313C] text-sm font-bold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]/40 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                    className="h-8 w-8 rounded-lg border border-[#26313C] text-sm font-bold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]/40 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={isMutating || missingRequired}
                onClick={() => void handleAdd()}
                className="w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isMutating
                  ? 'Adding…'
                  : missingRequired
                    ? 'Choose the required options'
                    : `Add to Cart • ${formatCurrency(unitPreview * quantity)}`}
              </button>

              <p className="text-center text-[10px] text-[#9AA6B2]/70">
                Final pricing is confirmed by the restaurant.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
