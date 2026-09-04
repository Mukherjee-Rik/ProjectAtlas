import { OrderStatus } from '../../../generated/prisma/enums';

export interface NormalizedOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface NormalizedCustomer {
  name: string;
  phone?: string;
  address?: string;
}

export interface NormalizedOrderPayload {
  externalOrderId: string;
  restaurantId: string;
  items: NormalizedOrderItem[];
  customer: NormalizedCustomer;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  metadata?: any;
}

export interface DeliveryProvider {
  createOrder(
    order: NormalizedOrderPayload,
    config: any,
  ): Promise<{
    externalOrderId: string;
    status: OrderStatus;
    rawResponse: any;
  }>;

  cancelOrder(
    externalOrderId: string,
    reason: string,
    config: any,
  ): Promise<{ success: boolean; rawResponse: any }>;

  getOrderStatus(externalOrderId: string, config: any): Promise<OrderStatus>;

  healthCheck(config: any): Promise<boolean>;
}
