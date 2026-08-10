import { apiClient } from './api-client';
import type { TaxRate } from '@/types/menu';

export async function getTaxRates() { return apiClient.get<{ success: boolean; data: TaxRate[] }>('/tax-rates'); }
export async function getTaxRateById(id: string) { return apiClient.get<{ success: boolean; data: TaxRate }>(`/tax-rates/${id}`); }
export async function createTaxRate(data: { name: string; type: 'PERCENTAGE' | 'FIXED'; value: number; status?: string }) { return apiClient.post<{ success: boolean; data: TaxRate }>('/tax-rates', data); }
export async function updateTaxRate(id: string, data: Partial<{ name: string; type: string; value: number; status: string }>) { return apiClient.patch<{ success: boolean; data: TaxRate }>(`/tax-rates/${id}`, data); }
export async function deleteTaxRate(id: string) { return apiClient.delete<void>(`/tax-rates/${id}`); }
