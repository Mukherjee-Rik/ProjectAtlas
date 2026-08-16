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

export interface OrderPaymentInfo {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string | null;
  transactionReference?: string | null;
}

export interface CancellationRequestInfo {
  id: string;
  reason: string;
  note?: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedByName?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface RefundInfo {
  id: string;
  amount: number;
  reason: string;
  note?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  requestedBy?: string | null;
  approvedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
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
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  cancellationNote?: string | null;
  createdAt: string;
  updatedAt: string;
  table?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  items: OrderItem[];
  payments?: OrderPaymentInfo[];
  cancellationRequests?: CancellationRequestInfo[];
  refunds?: RefundInfo[];
}

export interface CreateOrderPayload {
  cartId?: string;
}

export const CANCELLATION_REASONS = [
  { code: 'CUSTOMER_REQUESTED', label: 'Customer requested cancellation' },
  { code: 'WRONG_ORDER', label: 'Wrong order / Incorrect items' },
  { code: 'DUPLICATE_ORDER', label: 'Duplicate order' },
  { code: 'ITEM_UNAVAILABLE', label: 'Item unavailable in kitchen' },
  { code: 'KITCHEN_ISSUE', label: 'Kitchen / Equipment issue' },
  { code: 'PAYMENT_ISSUE', label: 'Payment issue' },
  { code: 'STAFF_MISTAKE', label: 'Staff mistake' },
  { code: 'TECHNICAL_ISSUE', label: 'Technical / POS issue' },
  { code: 'OTHER', label: 'Other (specify note)' },
] as const;

