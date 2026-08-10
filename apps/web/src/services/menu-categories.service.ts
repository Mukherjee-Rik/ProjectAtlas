import { apiClient } from './api-client';
import type { MenuCategory, MenuCategoryStatus } from '@/types/menu';

export interface MenuCategoriesResponse {
  success: boolean;
  data: MenuCategory[];
}

export interface MenuCategoryResponse {
  success: boolean;
  data: MenuCategory;
}

export interface CreateMenuCategoryPayload {
  menuId: string;
  name: string;
  code: string;
  position?: number;
  status?: MenuCategoryStatus;
}

export interface UpdateMenuCategoryPayload {
  menuId?: string;
  name?: string;
  code?: string;
  position?: number;
  status?: MenuCategoryStatus;
}

export async function getMenuCategories(menuId?: string) {
  const query = menuId ? `?menuId=${encodeURIComponent(menuId)}` : '';
  return apiClient.get<MenuCategoriesResponse>(`/menu-categories${query}`);
}

export async function getMenuCategoryById(id: string) {
  return apiClient.get<MenuCategoryResponse>(`/menu-categories/${id}`);
}

export async function createMenuCategory(data: CreateMenuCategoryPayload) {
  return apiClient.post<MenuCategoryResponse>('/menu-categories', data);
}

export async function updateMenuCategory(id: string, data: UpdateMenuCategoryPayload) {
  return apiClient.patch<MenuCategoryResponse>(`/menu-categories/${id}`, data);
}

export async function deleteMenuCategory(id: string) {
  return apiClient.delete<void>(`/menu-categories/${id}`);
}
