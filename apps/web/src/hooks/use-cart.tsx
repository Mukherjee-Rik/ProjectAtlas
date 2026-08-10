'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AddCartItemPayload, Cart } from '@/types/cart';
import { ApiError } from '@/services/api-error';
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
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
  addItem: (payload: AddCartItemPayload) => Promise<Cart>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function messageFrom(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
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

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCart(token);
      setCart(response.data);
      setError(null);
    } catch (err) {
      setError(messageFrom(err, 'Unable to load your cart'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (payload: AddCartItemPayload) => {
      setIsMutating(true);
      try {
        // The API answers every mutation with the whole cart, so there is no
        // second round trip and no client-side price maths.
        const response = await addCartItem(token, payload);
        setCart(response.data);
        setError(null);
        return response.data;
      } catch (err) {
        const message = messageFrom(err, 'Unable to add this item to your cart');
        setError(message);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setIsMutating(true);
      try {
        const response = await updateCartItemQuantity(token, itemId, quantity);
        setCart(response.data);
        setError(null);
      } catch (err) {
        setError(messageFrom(err, 'Unable to update the quantity'));
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setIsMutating(true);
      try {
        const response = await removeCartItem(token, itemId);
        setCart(response.data);
        setError(null);
      } catch (err) {
        setError(messageFrom(err, 'Unable to remove this item'));
      } finally {
        setIsMutating(false);
      }
    },
    [token],
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
