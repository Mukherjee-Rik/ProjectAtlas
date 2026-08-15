import { apiClient } from './api-client';
import type { VariantGroup, Variant } from '@/types/menu';

type VGResponse = { success: boolean; data: VariantGroup };
type VGListResponse = { success: boolean; data: VariantGroup[] };
type VResponse = { success: boolean; data: Variant };

export async function getVariantGroups(itemId: string) {
  return apiClient.get<VGListResponse>(`/menu-items/${itemId}/variant-groups`);
}

export async function createVariantGroup(itemId: string, data: { name: string; required?: boolean; position?: number }) {
  return apiClient.post<VGResponse>(`/menu-items/${itemId}/variant-groups`, data);
}

export async function updateVariantGroup(id: string, data: { name?: string; required?: boolean; position?: number }) {
  return apiClient.patch<VGResponse>(`/variant-groups/${id}`, data);
}

export async function deleteVariantGroup(id: string) {
  return apiClient.delete<void>(`/variant-groups/${id}`);
}

export async function createVariant(groupId: string, data: { name: string; price: number; position?: number; status?: string }) {
  return apiClient.post<VResponse>(`/variant-groups/${groupId}/variants`, data);
}

export async function updateVariant(id: string, data: { name?: string; price?: number; position?: number; status?: string }) {
  return apiClient.patch<VResponse>(`/variants/${id}`, data);
}

export async function deleteVariant(id: string) {
  return apiClient.delete<void>(`/variants/${id}`);
}
