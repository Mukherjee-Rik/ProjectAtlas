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
  addCartItem,
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

const CartContext = createContext<CartContextValue | undefined>(undefined);

function messageFrom(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
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

  // Keep a ref of the last verified database cart state
  const lastVerifiedCartRef = useRef<Cart | null>(null);

  const refreshCart = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getCart(token);
      const serverCart = response.data;
      lastVerifiedCartRef.current = serverCart;
      setCart(serverCart);
      setError(null);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  // Deterministic Add Item: guarantees DB persistence before proceeding
  const addItem = useCallback(
    async (payload: AddCartItemPayload, metadata?: Partial<CartItem>) => {
      if (!token) return undefined;
      setIsMutating(true);
      setError(null);

      try {
        const response = await addCartItem(token, payload);
        const updatedCart = response.data;
        lastVerifiedCartRef.current = updatedCart;
        setCart(updatedCart);
        return updatedCart;
      } catch (err: any) {
        console.error('Add cart item error:', err);
        const msg = messageFrom(err, 'Unable to add item to cart');
        setError(msg);
        // Rollback to last known good state
        if (lastVerifiedCartRef.current) {
          setCart(lastVerifiedCartRef.current);
        }
        throw new Error(msg);
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  // Deterministic Quantity Update
  const updateQuantity = useCallback(
    async (itemIdOrMenuItemId: string, quantity: number) => {
      if (!token || !cart) return;

      // Find the cart line ID
      const targetItem = cart.items.find(
        (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
      );

      if (!targetItem) {
        // If not found in current cart, refresh
        await refreshCart();
        return;
      }

      setIsMutating(true);
      setError(null);

      try {
        let response;
        if (quantity <= 0) {
          response = await removeCartItem(token, targetItem.id);
        } else {
          response = await updateCartItemQuantity(token, targetItem.id, quantity);
        }

        const updatedCart = response.data;
        lastVerifiedCartRef.current = updatedCart;
        setCart(updatedCart);
      } catch (err: any) {
        console.error('Update quantity error:', err);
        const msg = messageFrom(err, 'Unable to update item quantity');
        setError(msg);
        if (lastVerifiedCartRef.current) {
          setCart(lastVerifiedCartRef.current);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [token, cart, refreshCart],
  );

  // Deterministic Remove Item
  const removeItem = useCallback(
    async (itemIdOrMenuItemId: string) => {
      if (!token || !cart) return;

      const targetItem = cart.items.find(
        (i) => i.id === itemIdOrMenuItemId || i.menuItemId === itemIdOrMenuItemId,
      );

      if (!targetItem) {
        await refreshCart();
        return;
      }

      setIsMutating(true);
      setError(null);

      try {
        const response = await removeCartItem(token, targetItem.id);
        const updatedCart = response.data;
        lastVerifiedCartRef.current = updatedCart;
        setCart(updatedCart);
      } catch (err: any) {
        console.error('Remove cart item error:', err);
        const msg = messageFrom(err, 'Unable to remove item from cart');
        setError(msg);
        if (lastVerifiedCartRef.current) {
          setCart(lastVerifiedCartRef.current);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [token, cart, refreshCart],
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
