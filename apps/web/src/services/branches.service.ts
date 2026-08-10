import { apiClient } from './api-client';
import type { Branch, BranchStatus } from '@/types/branch';

export interface BranchesResponse {
  success: boolean;
  data: Branch[];
}

export interface BranchResponse {
  success: boolean;
  data: Branch;
}

export interface CreateBranchPayload {
  restaurantId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  status?: BranchStatus;
}

export interface UpdateBranchPayload {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  status?: BranchStatus;
}

export async function getBranches(restaurantId?: string) {
  const query = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
  return apiClient.get<BranchesResponse>(`/branches${query}`);
}

export async function getBranchById(id: string) {
  return apiClient.get<BranchResponse>(`/branches/${id}`);
}

export async function createBranch(data: CreateBranchPayload) {
  return apiClient.post<BranchResponse>('/branches', data);
}

export async function updateBranch(id: string, data: UpdateBranchPayload) {
  return apiClient.patch<BranchResponse>(`/branches/${id}`, data);
}

export async function deleteBranch(id: string) {
  return apiClient.delete<void>(`/branches/${id}`);
}
