export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemVariant {
  id: string;
  variantId?: string | null;
  name: string;
  price: number;
}

export interface OrderItemAddon {
  id: string;
  addonId?: string | null;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  variants: OrderItemVariant[];
  addons: OrderItemAddon[];
}

export interface Order {
  id: string;
  restaurantId: string;
  branchId: string;
  tableId?: string | null;
  customerSessionId?: string | null;
  orderNumber: string;
  status: OrderStatus;
  source?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  table?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  cartId?: string;
}
