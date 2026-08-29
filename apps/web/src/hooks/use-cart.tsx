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
import type { AddCartItemPayload, Cart, CartItem, CartItemVariant, CartItemAddon } from '@/types/cart';
import { ApiError } from '@/services/api-error';
import {
  getCart,
  addCartItem,
  setCartItemQuantity,
  updateCartItemQuantity,
  removeCartItem,
} from '@/services/cart.service';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
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

/** Identifies a cart line by its contents, so it survives id reassignment. */
interface SyncTarget {
  lineId: string;
  menuItemId: string;
  variantIds: string[];
  addonIds: string[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const OPTIMISTIC_ID_PREFIX = 'opt_';
const MAX_LINE_QUANTITY = 99;
const SYNC_DEBOUNCE_MS = 120;

function messageFrom(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

/**
 * True when the API does not expose the route at all — an older deployment than
 * this build. Kept distinct from a genuine "not found" so we can fall back to
 * the legacy endpoint instead of showing the customer an error.
 */
function isRouteUnavailable(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | undefined;
  if (e?.status === 405 || e?.status === 501) return true;
  return e?.status === 404 && /Cannot (POST|PATCH|GET|DELETE)/i.test(e?.message ?? '');
}

function computeCartSummary(items: CartItem[], cartId = 'cart_live'): Cart {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  return {
    id: cartId,
    updatedAt: new Date().toISOString(),
    items,
    itemCount: items.length,
    totalQuantity,
    subtotal,
  };
}

function getStoredCart(token: string): Cart | null {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const raw = sessionStorage.getItem(`atlas_cart_${token}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) return parsed;
    }
  } catch {}
  return null;
}

function setStoredCart(token: string, cart: Cart | null) {
  if (typeof window === 'undefined' || !token) return;
  try {
    if (cart) {
      sessionStorage.setItem(`atlas_cart_${token}`, JSON.stringify(cart));
    } else {
      sessionStorage.removeItem(`atlas_cart_${token}`);
    }
  } catch {}
}

/** Selection ids for a line, tolerating both server and optimistic shapes. */
function selectionIds(item: CartItem): { variantIds: string[]; addonIds: string[] } {
  return {
    variantIds: (item.variants ?? []).map((v) => v.variantId || v.id).filter(Boolean) as string[],
    addonIds: (item.addons ?? []).map((a) => a.addonId || a.id).filter(Boolean) as string[],
  };
}

/** Content identity for a line: same menu item, same selections. */
function lineKey(menuItemId: string, variantIds: string[], addonIds: string[]): string {
  return [menuItemId, [...variantIds].sort().join('|'), [...addonIds].sort().join('|')].join('::');
}

function keyOfItem(item: CartItem): string {
  const { variantIds, addonIds } = selectionIds(item);
  return lineKey(item.menuItemId, variantIds, addonIds);
}

function targetOf(item: CartItem): SyncTarget {
  return { lineId: item.id, menuItemId: item.menuItemId, ...selectionIds(item) };
}

export function CartProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  const initialCart = getStoredCart(token);
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [isLoading, setIsLoading] = useState(() => !initialCart);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The authoritative current cart, readable synchronously.
  //
  // A tap has to know, right away, which line it is changing so it can schedule
  // the matching request. Deriving that inside a setCart(prev => …) updater does
  // not work: React runs updaters during render, not at call time, so the value
  // was still unset by the time the request was scheduled.
  const cartRef = useRef<Cart | null>(initialCart);
  // Last cart the server confirmed, for rollback after a failed sync.
  const lastVerifiedCartRef = useRef<Cart | null>(initialCart);
  // Debounce timers and target quantities, keyed by line contents.
  const pendingQuantityTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingTargetQuantities = useRef<Map<string, number>>(new Map());
  // Bumped on every local mutation. A response is adopted only if nothing newer
  // happened while it was in flight, so a slow reply cannot reset a quantity the
  // customer has already tapped up again.
  const mutationSeqRef = useRef(0);
  // Adds still in flight, keyed by line contents, so a quantity change on a line
  // whose add has not returned can wait for its real id instead of guessing.
  const inFlightAdds = useRef<Map<string, Promise<unknown>>>(new Map());
  // null = untested. Set false the first time the API reports the absolute
  // quantity route missing, so an older deployment costs one probe, not one per tap.
  const setItemSupportedRef = useRef<boolean | null>(null);

  /** Single place that moves the cart forward, keeping ref, state and storage together. */
  const commitCart = useCallback(
    (next: Cart | null) => {
      cartRef.current = next;
      setCart(next);
      setStoredCart(token, next);
    },
    [token],
  );

  const applyServerCart = useCallback(
    (serverCart: Cart, seq: number) => {
      lastVerifiedCartRef.current = serverCart;
      if (seq !== mutationSeqRef.current) return;
      commitCart(serverCart);
    },
    [commitCart],
  );

  const rollback = useCallback(
    (err: unknown, fallbackMessage: string) => {
      const msg = messageFrom(err, fallbackMessage);
      setError(msg);
      if (lastVerifiedCartRef.current) {
        commitCart(lastVerifiedCartRef.current);
      }
      return msg;
    },
    [commitCart],
  );

  // Background fetch to reconcile server state with local state
  const refreshCart = useCallback(async () => {
    if (!token) return;
    const seq = mutationSeqRef.current;
    try {
      const response = await getCart(token);
      applyServerCart(response.data, seq);
      setError(null);
    } catch (err) {
      console.warn('Background cart refresh warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, applyServerCart]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  // Clean up pending timers on unmount
  useEffect(() => {
    const timers = pendingQuantityTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  /**
   * Syncs an absolute quantity after a short debounce, so a burst of + taps
   * costs one request rather than one each.
   *
   * Prefers the menu-item-keyed route, which ignores line ids entirely. Older
   * API deployments lack it, so the line-id route stays as a fallback — and there
   * the sync waits for any in-flight add first, because the server cannot
   * resolve a client-generated id.
   */
  const syncQuantity = useCallback(
    (target: SyncTarget, quantity: number) => {
      const key = lineKey(target.menuItemId, target.variantIds, target.addonIds);
      pendingTargetQuantities.current.set(key, quantity);

      const existingTimer = pendingQuantityTimers.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        pendingQuantityTimers.current.delete(key);
        const finalQuantity = pendingTargetQuantities.current.get(key) ?? quantity;
        pendingTargetQuantities.current.delete(key);

        // Preferred path: absolute quantity by contents, no line id involved.
        if (setItemSupportedRef.current !== false) {
          const seq = mutationSeqRef.current;
          try {
            const response = await setCartItemQuantity(token, {
              menuItemId: target.menuItemId,
              quantity: finalQuantity,
              variantIds: target.variantIds,
              addonIds: target.addonIds,
            });
            setItemSupportedRef.current = true;
            applyServerCart(response.data, seq);
            return;
          } catch (err: unknown) {
            if (!isRouteUnavailable(err)) {
              console.error('Update quantity sync error:', err);
              rollback(err, 'Unable to update item quantity');
              return;
            }
            setItemSupportedRef.current = false;
          }
        }

        // Fallback path needs a real server id, so let a pending add land first.
        const pendingAdd = inFlightAdds.current.get(key);
        if (pendingAdd) {
          try {
            await pendingAdd;
          } catch {
            return; // the add failed and already rolled the cart back
          }
        }

        const lineId =
          lastVerifiedCartRef.current?.items.find((i) => keyOfItem(i) === key)?.id ?? target.lineId;

        if (lineId.startsWith(OPTIMISTIC_ID_PREFIX)) {
          // The server has no line to update. A later reconcile carries the value.
          return;
        }

        const seq = mutationSeqRef.current;
        try {
          const response =
            finalQuantity <= 0
              ? await removeCartItem(token, lineId)
              : await updateCartItemQuantity(token, lineId, finalQuantity);
          applyServerCart(response.data, seq);
        } catch (err: unknown) {
          console.error('Update quantity sync error:', err);
          rollback(err, 'Unable to update item quantity');
        }
      }, SYNC_DEBOUNCE_MS);

      pendingQuantityTimers.current.set(key, timer);
    },
    [token, applyServerCart, rollback],
  );

  // 0ms Optimistic Add Item
  const addItem = useCallback(
    async (payload: AddCartItemPayload, metadata?: Partial<CartItem>) => {
      if (!token) return undefined;
      setError(null);

      const qtyToAdd = Math.max(1, payload.quantity ?? 1);
      const variantIds = payload.variantIds ?? [];
      const addonIds = payload.addonIds ?? [];
      const key = lineKey(payload.menuItemId, variantIds, addonIds);

      // 1. Update the visible cart immediately
      const seq = ++mutationSeqRef.current;
      const prev = cartRef.current;
      const items = prev?.items ? [...prev.items] : [];
      const existingIndex = items.findIndex((item) => keyOfItem(item) === key);

      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        const newQty = Math.min(MAX_LINE_QUANTITY, existing.quantity + qtyToAdd);
        items[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty,
        };
      } else {
        const unitPrice = Number(metadata?.unitPrice ?? 0);
        items.push({
          id: metadata?.id || `${OPTIMISTIC_ID_PREFIX}${payload.menuItemId}_${Date.now()}`,
          menuItemId: payload.menuItemId,
          name: metadata?.name || 'Menu Item',
          imageUrl: metadata?.imageUrl || null,
          dietaryType: metadata?.dietaryType || 'VEG',
          quantity: qtyToAdd,
          unitPrice,
          totalPrice: unitPrice * qtyToAdd,
          variant: (metadata?.variant as CartItemVariant) || null,
          variants: (metadata?.variants as CartItemVariant[]) || [],
          addons: (metadata?.addons as CartItemAddon[]) || [],
        });
      }

      commitCart(computeCartSummary(items, prev?.id || 'cart_live'));

      // 2. Sync in the background, published so a quantity change arriving
      //    mid-flight can wait for the real line id.
      setIsMutating(true);
      const request = addCartItem(token, payload);
      inFlightAdds.current.set(key, request);

      try {
        const response = await request;
        applyServerCart(response.data, seq);
        return response.data;
      } catch (err: unknown) {
        console.error('Add cart item error:', err);
        throw new Error(rollback(err, 'Unable to add item to cart'));
      } finally {
        inFlightAdds.current.delete(key);
        setIsMutating(false);
      }
    },
    [token, commitCart, applyServerCart, rollback],
  );

  // 0ms Optimistic Quantity Update with debounced sync
  const updateQuantity = useCallback(
    async (itemIdOrMenuItemId: string, targetQuantity: number) => {
      if (!token) return;
      setError(null);

      const prev = cartRef.current;
      if (!prev) return;

      const line = prev.items.find(
        (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
      );
      if (!line) return;

      const clampedQty = Math.max(0, Math.min(MAX_LINE_QUANTITY, targetQuantity));
      mutationSeqRef.current += 1;

      const items =
        clampedQty <= 0
          ? prev.items.filter((i) => i.id !== line.id)
          : prev.items.map((i) =>
              i.id === line.id
                ? { ...i, quantity: clampedQty, totalPrice: i.unitPrice * clampedQty }
                : i,
            );

      commitCart(computeCartSummary(items, prev.id));
      syncQuantity(targetOf(line), clampedQty);
    },
    [token, commitCart, syncQuantity],
  );

  // 0ms Optimistic Remove Item
  const removeItem = useCallback(
    async (itemIdOrMenuItemId: string) => {
      if (!token) return;
      setError(null);

      const prev = cartRef.current;
      if (!prev) return;

      const line = prev.items.find(
        (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
      );
      if (!line) return;

      mutationSeqRef.current += 1;
      commitCart(computeCartSummary(prev.items.filter((i) => i.id !== line.id), prev.id));

      // Quantity 0 deletes the line, through the same path so removal also works
      // on a line the server has not created yet.
      syncQuantity(targetOf(line), 0);
    },
    [token, commitCart, syncQuantity],
  );

  const clearError = useCallback(() => setError(null), []);

  const itemCount = useMemo(() => cart?.items.length ?? 0, [cart]);

  const totalQuantity = useMemo(
    () => cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [cart],
  );

  const subtotal = useMemo(
    () => cart?.items.reduce((sum, i) => sum + i.totalPrice, 0) ?? 0,
    [cart],
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      totalQuantity,
      subtotal,
      isLoading,
      isMutating,
      error,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearError,
    }),
    [
      cart,
      itemCount,
      totalQuantity,
      subtotal,
      isLoading,
      isMutating,
      error,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearError,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
