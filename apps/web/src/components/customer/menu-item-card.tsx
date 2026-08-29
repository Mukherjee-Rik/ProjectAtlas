'use client';

import { memo } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { DietaryType } from '@/types/menu';

const DIETARY_COLOR: Record<DietaryType, string> = {
  VEG: '#22C55E',
  VEGAN: '#22C55E',
  EGG: '#EAB308',
  NON_VEG: '#EF4444',
};

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
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 shadow-md">
      <div onClick={() => onOpen(item.id)} className="cursor-pointer space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DIETARY_COLOR[item.dietaryType] ?? '#A1A1AA' }}
              />
              <h3 className="text-sm font-bold leading-tight text-foreground">{item.name}</h3>
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
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-xl object-cover border border-border"
            />
          )}
        </div>
      </div>

      {/* Bottom Row: Price + Direct Inline Quantity Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex flex-col">
          <span className="text-base font-black text-primary">{formatCurrency(item.price)}</span>
          {hasCustomizations && (
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="text-[10px] text-muted-foreground hover:text-primary text-left underline"
            >
              Customisable options
            </button>
          )}
        </div>

        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => onQuickAdd(item)}
            className="flex items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-background active:scale-90 shadow-sm cursor-pointer"
          >
            <span>+</span> ADD
          </button>
        ) : (
          <div className="flex items-center rounded-xl border border-primary bg-secondary p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onDecrement(item, quantity)}
              className="flex h-7 w-8 items-center justify-center rounded-lg text-base font-bold text-primary transition-all hover:bg-primary/20 active:scale-75 cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="min-w-7 text-center text-xs font-bold font-mono text-foreground">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => onIncrement(item, quantity)}
              className="flex h-7 w-8 items-center justify-center rounded-lg text-base font-bold text-primary transition-all hover:bg-primary/20 active:scale-75 cursor-pointer"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export const MenuItemCard = memo(MenuItemCardComponent);
