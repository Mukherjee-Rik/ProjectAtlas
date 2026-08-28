import { publicApiClient } from './public-api-client';
import type { AddCartItemPayload, Cart } from '@/types/cart';

type CartResponse = { success: boolean; data: Cart };

function cartPath(token: string) {
  return `/public/tables/${token}/cart`;
}

export async function getCart(token: string) {
  return publicApiClient.get<CartResponse>(cartPath(token));
}

export async function addCartItem(token: string, payload: AddCartItemPayload) {
  const cleanPayload = {
    menuItemId: payload.menuItemId,
    quantity: payload.quantity ?? 1,
    ...(payload.variantIds && payload.variantIds.length > 0 ? { variantIds: payload.variantIds } : {}),
    ...(payload.addonIds && payload.addonIds.length > 0 ? { addonIds: payload.addonIds } : {}),
  };
  return publicApiClient.post<CartResponse>(`${cartPath(token)}/items`, cleanPayload);
}

export async function setCartItem(token: string, payload: AddCartItemPayload) {
  return addCartItem(token, payload);
}

export async function updateCartItemQuantity(
  token: string,
  itemId: string,
  quantity: number,
) {
  try {
    return await publicApiClient.patch<CartResponse>(`${cartPath(token)}/items/${itemId}`, {
      quantity,
    });
  } catch {
    return publicApiClient.post<CartResponse>(`${cartPath(token)}/items/${itemId}`, {
      quantity,
    });
  }
}

export async function removeCartItem(token: string, itemId: string) {
  return publicApiClient.delete<CartResponse>(`${cartPath(token)}/items/${itemId}`);
}
