'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AddCartItemPayload, Cart, CartItem } from '@/types/cart';
import { ApiError } from '@/services/api-error';
import {
  getCart,
  setCartItem,
  removeCartItem,
} from '@/services/cart.service';

interface CartContextValue {
  cart: Cart | null;
  /** Distinct cart lines — "2 items". */
  itemCount: number;
  /** Sum of line quantities — "5 units". */
  totalQuantity: number;
  subtotal: number;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addItem: (payload: AddCartItemPayload, metadata?: Partial<CartItem>) => Promise<Cart | undefined>;
  updateQuantity: (itemIdOrMenuItemId: string, quantity: number) => Promise<void>;
  removeItem: (itemIdOrMenuItemId: string) => Promise<void>;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function messageFrom(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function recalculateCart(items: CartItem[], prevCartId = 'cart_live'): Cart {
  let subtotal = 0;
  let totalQuantity = 0;
  for (const item of items) {
    subtotal += Number(item.totalPrice || 0);
    totalQuantity += Number(item.quantity || 0);
  }
  return {
    id: prevCartId,
    updatedAt: new Date().toISOString(),
    items,
    itemCount: items.length,
    totalQuantity,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

export function CartProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latest verified DB cart snapshot
  const dbCartRef = useRef<Cart | null>(null);
  // Map of in-flight / debounced mutations: menuItemId -> timeout
  const syncTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Map of target quantities: menuItemId -> quantity
  const targetQuantitiesRef = useRef<Map<string, number>>(new Map());

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCart(token);
      dbCartRef.current = response.data;
      // Only sync into state if there are no pending local debounced changes
      if (syncTimersRef.current.size === 0) {
        setCart(response.data);
      }
      setError(null);
    } catch (err) {
      setError(messageFrom(err, 'Unable to load your cart'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCart();

    return () => {
      syncTimersRef.current.forEach((t) => clearTimeout(t));
      syncTimersRef.current.clear();
      targetQuantitiesRef.current.clear();
    };
  }, [refreshCart]);

  // Unified Atomic Background Sync Engine for an item
  const scheduleSync = useCallback(
    (menuItemId: string, targetQty: number, payload?: AddCartItemPayload) => {
      targetQuantitiesRef.current.set(menuItemId, targetQty);

      const existingTimer = syncTimersRef.current.get(menuItemId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        syncTimersRef.current.delete(menuItemId);
        const finalQty = targetQuantitiesRef.current.get(menuItemId) ?? targetQty;
        targetQuantitiesRef.current.delete(menuItemId);

        try {
          const res = await setCartItem(token, {
            menuItemId,
            quantity: finalQty,
            variantIds: payload?.variantIds,
            addonIds: payload?.addonIds,
          });

          if (res?.data) {
            dbCartRef.current = res.data;
            // Only update local UI state if user hasn't clicked again during the network call
            if (!syncTimersRef.current.has(menuItemId)) {
              setCart(res.data);
            }
          }
        } catch (err) {
          console.error('Cart sync error:', err);
        }
      }, 200); // 200ms debounce

      syncTimersRef.current.set(menuItemId, timer);
    },
    [token],
  );

  // Instant 0ms Optimistic Add
  const addItem = useCallback(
    async (payload: AddCartItemPayload, metadata?: Partial<CartItem>) => {
      const menuItemId = payload.menuItemId;
      const qtyToAdd = payload.quantity ?? 1;
      let nextQty = qtyToAdd;

      // 1. Instant 0ms Local UI Update
      setCart((prev) => {
        const items = prev?.items ? [...prev.items] : [];
        const existingIndex = items.findIndex(
          (i) => i.menuItemId === menuItemId && (!payload.variantIds?.length || i.variants.length === 0),
        );

        if (existingIndex >= 0) {
          const existing = items[existingIndex];
          nextQty = existing.quantity + qtyToAdd;
          items[existingIndex] = {
            ...existing,
            quantity: nextQty,
            totalPrice: Number(existing.unitPrice) * nextQty,
          };
        } else {
          nextQty = qtyToAdd;
          const unitPrice = metadata?.unitPrice ?? (metadata as any)?.price ?? 0;
          const newItem: CartItem = {
            id: `opt_${Date.now()}_${Math.random()}`,
            menuItemId,
            name: metadata?.name ?? 'Item',
            imageUrl: metadata?.imageUrl ?? null,
            dietaryType: metadata?.dietaryType ?? 'NON_VEG',
            quantity: nextQty,
            unitPrice: Number(unitPrice),
            totalPrice: Number(unitPrice) * nextQty,
            variant: null,
            variants: [],
            addons: [],
          };
          items.push(newItem);
        }

        return recalculateCart(items, prev?.id);
      });

      // 2. Schedule atomic sync
      scheduleSync(menuItemId, nextQty, payload);
      return undefined;
    },
    [scheduleSync],
  );

  // Instant 0ms Optimistic Quantity Update
  const updateQuantity = useCallback(
    async (itemIdOrMenuItemId: string, quantity: number) => {
      let resolvedMenuItemId = itemIdOrMenuItemId;

      // 1. Instant 0ms Local UI Update
      setCart((prev) => {
        if (!prev) return null;
        let items = [...prev.items];
        const idx = items.findIndex(
          (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
        );

        if (idx >= 0) {
          resolvedMenuItemId = items[idx].menuItemId;
          if (quantity <= 0) {
            items.splice(idx, 1);
          } else {
            const item = items[idx];
            items[idx] = {
              ...item,
              quantity,
              totalPrice: Number(item.unitPrice) * quantity,
            };
          }
        } else if (quantity <= 0) {
          items = items.filter((i) => i.id !== itemIdOrMenuItemId && i.menuItemId !== itemIdOrMenuItemId);
        }
        return recalculateCart(items, prev.id);
      });

      // 2. Schedule atomic sync
      scheduleSync(resolvedMenuItemId, quantity);
    },
    [scheduleSync],
  );

  // Instant 0ms Optimistic Remove
  const removeItem = useCallback(
    async (itemIdOrMenuItemId: string) => {
      let resolvedMenuItemId = itemIdOrMenuItemId;

      // 1. Instant 0ms Local UI Update
      setCart((prev) => {
        if (!prev) return null;
        const item = prev.items.find(
          (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
        );
        if (item) resolvedMenuItemId = item.menuItemId;

        const items = prev.items.filter(
          (i) => i.id !== itemIdOrMenuItemId && i.menuItemId !== itemIdOrMenuItemId,
        );
        return recalculateCart(items, prev.id);
      });

      // 2. Schedule atomic sync to remove
      scheduleSync(resolvedMenuItemId, 0);
    },
    [scheduleSync],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      totalQuantity: cart?.totalQuantity ?? 0,
      subtotal: cart?.subtotal ?? 0,
      isLoading,
      isMutating,
      error,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearError,
    }),
    [cart, isLoading, isMutating, error, refreshCart, addItem, updateQuantity, removeItem, clearError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
