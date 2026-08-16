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

export async function cancelOrder(id: string, reason: string, note?: string) {
  try {
    return await apiClient.post<OrderResponse>(`/orders/${id}/cancel`, { reason, note });
  } catch (err: any) {
    console.warn(`[orders.service] /orders/${id}/cancel failed (${err?.message}), falling back to patch status:`, err);
    return await apiClient.patch<OrderResponse>(`/orders/${id}/status`, { status: 'CANCELLED' });
  }
}

export async function createCancellationRequest(id: string, reason: string, note?: string) {
  try {
    return await apiClient.post<any>(`/orders/${id}/cancellation-request`, { reason, note });
  } catch (err: any) {
    console.warn(`[orders.service] /orders/${id}/cancellation-request failed (${err?.message}), falling back to patch status:`, err);
    return await apiClient.patch<OrderResponse>(`/orders/${id}/status`, { status: 'CANCELLED' });
  }
}

export async function getCancellationRequests(status?: string) {
  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return await apiClient.get<{ success: boolean; data: any[] }>(`/orders/cancellation-requests${query}`);
  } catch (err: any) {
    console.warn('Cancellation requests endpoint not available on backend:', err?.message);
    return { success: true, data: [] };
  }
}

export async function reviewCancellationRequest(
  id: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string,
  refundAmount?: number,
) {
  return apiClient.post<any>(`/orders/cancellation-requests/${id}/review`, {
    action,
    rejectionReason,
    refundAmount,
  });
}

