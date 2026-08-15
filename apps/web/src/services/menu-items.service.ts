import { apiClient } from './api-client';
import type { MenuItem, MenuItemStatus, DietaryType, FoodType } from '@/types/menu';

export interface MenuItemsResponse { success: boolean; data: MenuItem[]; }
export interface MenuItemResponse { success: boolean; data: MenuItem; }

export interface CreateMenuItemPayload {
  categoryId: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  price: number;
  dietaryType?: DietaryType;
  foodType?: FoodType;
  preparationTimeMinutes?: number;
  taxRateId?: string;
  position?: number;
  status?: MenuItemStatus;
}

export interface UpdateMenuItemPayload {
  categoryId?: string;
  name?: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  dietaryType?: DietaryType;
  foodType?: FoodType;
  preparationTimeMinutes?: number;
  taxRateId?: string;
  position?: number;
  status?: MenuItemStatus;
}

export async function getMenuItems(categoryId?: string) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return apiClient.get<MenuItemsResponse>(`/menu-items${query}`);
}

export async function getMenuItemById(id: string) {
  return apiClient.get<MenuItemResponse>(`/menu-items/${id}`);
}

export async function createMenuItem(data: CreateMenuItemPayload) {
  return apiClient.post<MenuItemResponse>('/menu-items', data);
}

export async function updateMenuItem(id: string, data: UpdateMenuItemPayload) {
  return apiClient.patch<MenuItemResponse>(`/menu-items/${id}`, data);
}

export async function deleteMenuItem(id: string) {
  return apiClient.delete<void>(`/menu-items/${id}`);
}
