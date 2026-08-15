import { apiClient } from './api-client';
import type { AddonGroup, Addon } from '@/types/menu';

type AGResponse = { success: boolean; data: AddonGroup };
type AGListResponse = { success: boolean; data: AddonGroup[] };
type AResponse = { success: boolean; data: Addon };

export async function getAddonGroups(itemId: string) {
  return apiClient.get<AGListResponse>(`/menu-items/${itemId}/addon-groups`);
}

export async function createAddonGroup(itemId: string, data: { name: string; required?: boolean; minSelect?: number; maxSelect?: number; position?: number }) {
  return apiClient.post<AGResponse>(`/menu-items/${itemId}/addon-groups`, data);
}

export async function updateAddonGroup(id: string, data: { name?: string; required?: boolean; minSelect?: number; maxSelect?: number; position?: number }) {
  return apiClient.patch<AGResponse>(`/addon-groups/${id}`, data);
}

export async function deleteAddonGroup(id: string) {
  return apiClient.delete<void>(`/addon-groups/${id}`);
}

export async function createAddon(groupId: string, data: { name: string; price: number; position?: number; status?: string }) {
  return apiClient.post<AResponse>(`/addon-groups/${groupId}/addons`, data);
}

export async function updateAddon(id: string, data: { name?: string; price?: number; position?: number; status?: string }) {
  return apiClient.patch<AResponse>(`/addons/${id}`, data);
}

export async function deleteAddon(id: string) {
  return apiClient.delete<void>(`/addons/${id}`);
}
