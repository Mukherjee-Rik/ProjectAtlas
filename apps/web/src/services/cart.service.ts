import { apiClient } from './api-client';
import type { AddCartItemPayload, Cart } from '@/types/cart';

type CartResponse = { success: boolean; data: Cart };

function cartPath(token: string) {
  return `/public/tables/${token}/cart`;
}

export async function getCart(token: string) {
  return apiClient.get<CartResponse>(cartPath(token));
}

export async function addCartItem(token: string, payload: AddCartItemPayload) {
  return apiClient.post<CartResponse>(`${cartPath(token)}/items`, payload);
}

export async function updateCartItemQuantity(
  token: string,
  itemId: string,
  quantity: number,
) {
  return apiClient.patch<CartResponse>(`${cartPath(token)}/items/${itemId}`, {
    quantity,
  });
}

export async function removeCartItem(token: string, itemId: string) {
  return apiClient.delete<CartResponse>(`${cartPath(token)}/items/${itemId}`);
}
