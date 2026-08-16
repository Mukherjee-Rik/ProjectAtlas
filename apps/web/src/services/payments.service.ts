import { apiClient } from './api-client';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    table?: {
      id: string;
      name: string;
      code: string;
    } | null;
  } | null;
  refunds?: {
    id: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
  }[];
}

export interface RefundRecord {
  id: string;
  amount: number;
  reason: string;
  note?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  requestedBy?: string | null;
  approvedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    table?: {
      id: string;
      name: string;
    } | null;
  } | null;
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    transactionReference?: string | null;
  } | null;
}

export async function getPayments() {
  return apiClient.get<any>('/payments');
}

export async function getRefunds() {
  try {
    return await apiClient.get<any>('/payments/refunds');
  } catch (err: any) {
    console.warn('Refunds endpoint not available on backend:', err?.message);
    return { success: true, data: [] };
  }
}

export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string,
  note?: string,
) {
  return apiClient.post<any>(`/payments/${paymentId}/refund`, {
    amount,
    reason,
    note,
  });
}
