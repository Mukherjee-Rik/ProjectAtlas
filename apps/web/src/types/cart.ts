import type { DietaryType } from './menu';

export interface CartItemVariant {
  id: string;
  variantId: string;
  name: string;
  price: number;
}

export interface CartItemAddon {
  id: string;
  addonId: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  dietaryType: DietaryType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** First variant selection — present for single variant group items. */
  variant: CartItemVariant | null;
  /** Every variant selection, one per variant group. */
  variants: CartItemVariant[];
  addons: CartItemAddon[];
}

export interface Cart {
  id: string;
  updatedAt: string;
  items: CartItem[];
  /** Distinct cart lines, e.g. "2 items". */
  itemCount: number;
  /** Sum of every line quantity, e.g. "5 units". */
  totalQuantity: number;
  subtotal: number;
}

export interface AddCartItemPayload {
  menuItemId: string;
  quantity?: number;
  variantIds?: string[];
  addonIds?: string[];
}
