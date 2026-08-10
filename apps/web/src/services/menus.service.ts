import { apiClient } from './api-client';
import type { Menu, MenuStatus } from '@/types/menu';

export interface MenusResponse {
  success: boolean;
  data: Menu[];
}

export interface MenuResponse {
  success: boolean;
  data: Menu;
}

export interface CreateMenuPayload {
  name: string;
  code: string;
  status?: MenuStatus;
}

export interface UpdateMenuPayload {
  name?: string;
  code?: string;
  status?: MenuStatus;
}

export async function getMenus() {
  return apiClient.get<MenusResponse>('/menus');
}

export async function getMenuById(id: string) {
  return apiClient.get<MenuResponse>(`/menus/${id}`);
}

export async function createMenu(data: CreateMenuPayload) {
  return apiClient.post<MenuResponse>('/menus', data);
}

export async function updateMenu(id: string, data: UpdateMenuPayload) {
  return apiClient.patch<MenuResponse>(`/menus/${id}`, data);
}

export async function deleteMenu(id: string) {
  return apiClient.delete<void>(`/menus/${id}`);
}
