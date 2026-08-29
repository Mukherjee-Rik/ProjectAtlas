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

/**
 * Sets an absolute quantity for the line matching this menu item plus its
 * variant/addon selection, creating or deleting the line as needed.
 *
 * Keyed by menuItemId rather than the cart line's id, so it works while an
 * add is still in flight and the line only exists optimistically on the
 * client. Quantity 0 removes the line.
 */
export async function setCartItemQuantity(token: string, payload: AddCartItemPayload) {
  const variantIds = payload.variantIds ?? [];
  const addonIds = payload.addonIds ?? [];
  return publicApiClient.post<CartResponse>(`${cartPath(token)}/set-item`, {
    menuItemId: payload.menuItemId,
    quantity: payload.quantity ?? 0,
    ...(variantIds.length > 0 ? { variantIds } : {}),
    ...(addonIds.length > 0 ? { addonIds } : {}),
  });
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
  } catch (err: unknown) {
    // Older deployments expose this as POST rather than PATCH. Retry only for
    // a verb rejection — retrying a 404 doubled the wait before the UI could
    // even show that the update had failed.
    const status = (err as { status?: number } | undefined)?.status;
    if (status !== 405 && status !== 501) throw err;
    return publicApiClient.post<CartResponse>(`${cartPath(token)}/items/${itemId}`, {
      quantity,
    });
  }
}

export async function removeCartItem(token: string, itemId: string) {
  return publicApiClient.delete<CartResponse>(`${cartPath(token)}/items/${itemId}`);
}
