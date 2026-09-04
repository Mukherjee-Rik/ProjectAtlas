'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Plus, Check, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface SmartPairingProps {
  activeMenu?: any;
  cartItems?: any[];
  selectedItem?: any;
  onAddPairing: (item: any) => void;
  compact?: boolean;
}

export function SmartPairingRecommendations({
  activeMenu,
  cartItems = [],
  selectedItem,
  onAddPairing,
  compact = false,
}: SmartPairingProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkSetting = () => {
      try {
        const stored = localStorage.getItem('kafei_ai_upsell_enabled');
        setIsEnabled(stored !== 'false');
      } catch {
        setIsEnabled(true);
      }
    };

    checkSetting();
    window.addEventListener('kafei:ai-settings-updated', checkSetting);
    return () => window.removeEventListener('kafei:ai-settings-updated', checkSetting);
  }, []);

  // Compute smart pairings based on cart & selected item
  const recommendations = useMemo(() => {
    if (!activeMenu || !activeMenu.categories) return [];

    const cartNames = new Set(
      cartItems.map((c) => (c.name || '').toLowerCase().trim())
    );
    if (selectedItem?.name) {
      cartNames.add(selectedItem.name.toLowerCase().trim());
    }

    const allItems: any[] = [];
    activeMenu.categories.forEach((cat: any) => {
      (cat.items || []).forEach((item: any) => {
        allItems.push({
          ...item,
          categoryName: cat.name,
        });
      });
    });

    if (allItems.length === 0) return [];

    // Filter out items already in cart
    const candidates = allItems.filter(
      (item) => !cartNames.has((item.name || '').toLowerCase().trim())
    );

    // Prioritize complementary categories (Beverages, Drinks, Sides, Appetizers, Desserts)
    const beverageOrDessert = candidates.filter((item) => {
      const catLower = (item.categoryName || '').toLowerCase();
      const nameLower = (item.name || '').toLowerCase();
      return (
        catLower.includes('drink') ||
        catLower.includes('beverage') ||
        catLower.includes('dessert') ||
        catLower.includes('side') ||
        catLower.includes('starter') ||
        catLower.includes('appetizer') ||
        nameLower.includes('coffee') ||
        nameLower.includes('tea') ||
        nameLower.includes('mojito') ||
        nameLower.includes('shake') ||
        nameLower.includes('bread') ||
        nameLower.includes('cake')
      );
    });

    if (beverageOrDessert.length > 0) {
      return beverageOrDessert.slice(0, compact ? 2 : 3);
    }

    return candidates.slice(0, compact ? 2 : 3);
  }, [activeMenu, cartItems, selectedItem, compact]);

  if (!isEnabled || recommendations.length === 0) {
    return null;
  }

  const handleAdd = (item: any) => {
    onAddPairing(item);
    setAddedItemIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/60 to-card p-4 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>AI Suggested Pairings &amp; Combos</span>
              <span className="rounded-full bg-primary/20 border border-primary/30 px-1.5 py-0.2 text-[9px] font-extrabold text-primary uppercase tracking-wider">
                Smart Upsell
              </span>
            </h4>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
          Frequently ordered together
        </span>
      </div>

      <div className={`grid gap-2.5 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {recommendations.map((item) => {
          const isAdded = addedItemIds.has(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 p-2.5 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-all"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-primary">
                    {formatCurrency(item.price)}
                  </span>
                  {item.categoryName && (
                    <span className="text-[9px] text-muted-foreground truncate">
                      • {item.categoryName}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(item)}
                className={`flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  isAdded
                    ? 'bg-atlas-success text-white'
                    : 'bg-primary text-background hover:bg-primary-hover active:scale-[0.97]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Add Pair</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
