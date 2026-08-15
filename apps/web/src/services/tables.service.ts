import { apiClient } from './api-client';
import type { RestaurantTable, TableStatus } from '@/types/table';

export interface TablesResponse {
  success: boolean;
  data: RestaurantTable[];
}

export interface TableResponse {
  success: boolean;
  data: RestaurantTable;
}

export interface TableQrResponse {
  success: boolean;
  data: {
    tableId: string;
    tableName: string;
    publicToken: string;
    url: string;
    qrCodeSvg: string;
  };
}

export interface CreateTablePayload {
  diningAreaId: string;
  name: string;
  code: string;
  capacity: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  diningAreaId?: string;
  name?: string;
  code?: string;
  capacity?: number;
  status?: TableStatus;
}

export async function getTables(diningAreaId?: string) {
  const query = diningAreaId ? `?diningAreaId=${encodeURIComponent(diningAreaId)}` : '';
  return apiClient.get<TablesResponse>(`/tables${query}`);
}

export async function getTableById(id: string) {
  return apiClient.get<TableResponse>(`/tables/${id}`);
}

export async function getTableQr(id: string, baseUrl?: string) {
  const qs = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
  return apiClient.get<TableQrResponse>(`/tables/${id}/qr${qs}`);
}

export async function regenerateTableQr(id: string, baseUrl?: string) {
  const qs = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
  return apiClient.post<TableQrResponse>(`/tables/${id}/qr/regenerate${qs}`);
}

export async function createTable(data: CreateTablePayload) {
  return apiClient.post<TableResponse>('/tables', data);
}

export async function updateTable(id: string, data: UpdateTablePayload) {
  return apiClient.patch<TableResponse>(`/tables/${id}`, data);
}

export async function deleteTable(id: string) {
  return apiClient.delete<void>(`/tables/${id}`);
}
