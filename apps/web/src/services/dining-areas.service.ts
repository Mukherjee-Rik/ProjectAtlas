import { apiClient } from './api-client';
import type { DiningArea, DiningAreaStatus } from '@/types/dining-area';

export interface DiningAreasResponse {
  success: boolean;
  data: DiningArea[];
}

export interface DiningAreaResponse {
  success: boolean;
  data: DiningArea;
}

export interface CreateDiningAreaPayload {
  name: string;
  code: string;
  status?: DiningAreaStatus;
}

export interface UpdateDiningAreaPayload {
  name?: string;
  code?: string;
  status?: DiningAreaStatus;
}

export async function getDiningAreas() {
  return apiClient.get<DiningAreasResponse>('/dining-areas');
}

export async function getDiningAreaById(id: string) {
  return apiClient.get<DiningAreaResponse>(`/dining-areas/${id}`);
}

export async function createDiningArea(data: CreateDiningAreaPayload) {
  return apiClient.post<DiningAreaResponse>('/dining-areas', data);
}

export async function updateDiningArea(id: string, data: UpdateDiningAreaPayload) {
  return apiClient.patch<DiningAreaResponse>(`/dining-areas/${id}`, data);
}

export async function deleteDiningArea(id: string) {
  return apiClient.delete<void>(`/dining-areas/${id}`);
}
