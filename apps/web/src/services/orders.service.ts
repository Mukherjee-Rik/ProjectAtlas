import { apiClient } from './api-client';
import type { CreateOrderPayload, Order, OrderStatus } from '@/types/order';

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
}

export async function createPublicOrder(token: string, payload?: CreateOrderPayload) {
  return apiClient.post<OrderResponse>(`/public/tables/${token}/orders`, payload ?? {});
}

export async function getPublicOrders(token: string) {
  return apiClient.get<OrdersResponse>(`/public/tables/${token}/orders`);
}

export async function getPublicOrderById(token: string, orderId: string) {
  return apiClient.get<OrderResponse>(`/public/tables/${token}/orders/${orderId}`);
}

export async function getOrders(status?: OrderStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get<OrdersResponse>(`/orders${query}`);
}

export async function getOrderById(id: string) {
  return apiClient.get<OrderResponse>(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return apiClient.patch<OrderResponse>(`/orders/${id}/status`, { status });
}
