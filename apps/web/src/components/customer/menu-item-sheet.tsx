'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import type { PublicCustomerMenuItemDetail } from '@/types/menu';
import { getPublicCustomerMenuItem } from '@/services/public-tables.service';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/currency';
import { DietaryMark } from '@/components/customer/dietary-mark';

const MAX_QUANTITY = 99;

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
  const { addItem, error, clearError } = useCart();

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Read through a ref so the modal effect below can run once on open. Bound
  // directly it would re-run on every cart tap — the menu re-renders then, and
  // a fresh `onClose` closure would yank focus back to the close button.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  // The sheet is a modal, so it behaves like one: Escape closes it, the menu
  // behind it stops scrolling, Tab stays inside, and focus starts on the close
  // button rather than wherever the diner happened to be on the page.
  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
      const selectedVariants = (item.variantGroups ?? [])
        .flatMap((g) => g.variants)
        .filter((v) => variantIds.includes(v.id))
        .map((v) => ({ id: v.id, variantId: v.id, name: v.name, price: v.price }));
      const selectedAddons = (item.addonGroups ?? [])
        .flatMap((g) => g.addons)
        .filter((a) => addonIds.includes(a.id))
        .map((a) => ({ id: a.id, addonId: a.id, name: a.name, price: a.price }));

      void addItem(
        { menuItemId: item.id, quantity, variantIds, addonIds },
        {
          name: item.name,
          unitPrice: unitPreview,
          imageUrl: item.imageUrl,
          dietaryType: item.dietaryType,
          variant: selectedVariants[0] ?? null,
          variants: selectedVariants,
          addons: selectedAddons,
        },
      );
      onAdded();
    } catch {
      // The hook surfaces the message; the sheet stays open so it can be fixed.
    }
  }, [item, quantity, variantIds, addonIds, unitPreview, addItem, onAdded]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
    >
      {/* dvh, not vh: on iOS Safari `vh` is the URL-bar-hidden height, so with
          the bar showing the sheet grew taller than the space it was given and
          clipped its own Add to Cart button. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-border bg-card text-foreground sm:max-h-[80dvh] sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="text-base font-bold leading-tight break-words">
              {item?.name ?? (loadError ? 'Unavailable' : 'Loading…')}
            </h2>
            {item?.category?.name && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.category.name}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex shrink-0 items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-2/3 rounded bg-secondary" />
              <div className="h-3 w-1/2 rounded bg-secondary" />
              <div className="h-20 rounded-xl bg-secondary" />
            </div>
          )}

          {loadError && (
            <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error">
              {loadError}
            </div>
          )}

          {item && (
            <>
              <div className="space-y-2">
                {item.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <DietaryMark type={item.dietaryType} />
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(item.price)}
                  </span>
                  {item.preparationTimeMinutes ? (
                    <span className="text-[10px] text-muted-foreground">
                      • {item.preparationTimeMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>

              {(item.variantGroups ?? []).map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {group.name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
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
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary text-foreground hover:border-primary/40'
                          }`}
                        >
                          <span className="min-w-0 font-semibold break-words">{variant.name}</span>
                          <span className="shrink-0">
                            {variant.price > 0 ? `+ ${formatCurrency(variant.price)}` : '—'}
                          </span>
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {group.name}
                      </h3>
                      <span className="text-[10px] text-muted-foreground">
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
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-secondary text-foreground hover:border-primary/40'
                            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                              {selected ? (
                                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                              )}
                              <span className="break-words">{addon.name}</span>
                            </span>
                            <span className="shrink-0">
                              {addon.price > 0 ? `+ ${formatCurrency(addon.price)}` : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={missingRequired}
                onClick={() => void handleAdd()}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {missingRequired
                  ? 'Choose the required options'
                  : `Add to Cart • ${formatCurrency(unitPreview * quantity)}`}
              </button>

              <p className="text-center text-[10px] text-muted-foreground/70">
                Final pricing is confirmed by the restaurant.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
