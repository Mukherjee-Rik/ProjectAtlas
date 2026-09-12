'use client';

import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DietaryMark } from '@/components/customer/dietary-mark';
import type { DietaryType } from '@/types/menu';

export interface MenuCardItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  dietaryType: DietaryType;
  variantGroups?: unknown[];
  addonGroups?: unknown[];
}

interface MenuItemCardProps {
  item: MenuCardItem;
  /** This item's quantity in the cart. The only value that changes as taps land. */
  quantity: number;
  onOpen: (itemId: string) => void;
  onQuickAdd: (item: MenuCardItem) => void;
  onIncrement: (item: MenuCardItem, currentQty: number) => void;
  onDecrement: (item: MenuCardItem, currentQty: number) => void;
}

/**
 * One row of the customer menu.
 *
 * Memoised deliberately: the cart lives in a context, so every tap re-renders
 * the menu page, and a full menu is dozens of these. Taking `quantity` as a
 * plain number rather than reading the cart here means React can skip every card
 * except the one whose quantity actually moved, which is what keeps a tap from
 * costing a whole-list render.
 */
function MenuItemCardComponent({
  item,
  quantity,
  onOpen,
  onQuickAdd,
  onIncrement,
  onDecrement,
}: MenuItemCardProps) {
  const hasCustomizations =
    (item.variantGroups && item.variantGroups.length > 0) ||
    (item.addonGroups && item.addonGroups.length > 0);

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      {/* A real button, not a div: opening an item is the main action on this
          screen, so it has to be reachable by keyboard and switch control. */}
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`View ${item.name}`}
        className="w-full space-y-1.5 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <DietaryMark type={item.dietaryType} />
              <h3 className="text-sm font-bold leading-tight text-foreground break-words">
                {item.name}
              </h3>
            </div>
            {item.description && (
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>

          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
            />
          )}
        </div>
      </button>

      {/* Bottom Row: Price + Direct Inline Quantity Controls */}
      <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-black text-primary">{formatCurrency(item.price)}</span>
          {hasCustomizations && (
            // Information, not a second control: the card itself already opens
            // the sheet, and as a button the coarse-pointer 44px minimum made
            // customisable cards visibly taller than plain ones.
            <span className="text-[11px] text-muted-foreground">Customisable</span>
          )}
        </div>

        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => onQuickAdd(item)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-5 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-background"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> ADD
          </button>
        ) : (
          <div className="flex shrink-0 items-center rounded-xl border border-primary bg-secondary p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onDecrement(item, quantity)}
              className="flex h-7 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/20"
              aria-label={`Decrease ${item.name} quantity`}
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </button>

            <span className="min-w-7 text-center font-mono text-xs font-bold text-foreground">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => onIncrement(item, quantity)}
              className="flex h-7 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/20"
              aria-label={`Increase ${item.name} quantity`}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export const MenuItemCard = memo(MenuItemCardComponent);
