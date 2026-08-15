import { apiClient } from './api-client';
import type { User, UserRole, UserStatus } from '@/types/user';

export interface UsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  meta: UsersMeta;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UsersQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateMyProfilePayload {
  name?: string;
  phone?: string | null;
}

export async function getUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams();

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.role) {
    params.set('role', query.role);
  }

  if (query.status) {
    params.set('status', query.status);
  }

  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  const queryString = params.toString();

  return apiClient.get<UsersResponse>(
    `/users${queryString ? `?${queryString}` : ''}`,
  );
}

export async function getCurrentUser() {
  return apiClient.get<UserResponse>('/users/me');
}

export async function updateMyProfile(data: UpdateMyProfilePayload) {
  return apiClient.patch<UserResponse>('/users/me', data);
}

export async function getUserById(id: string) {
  return apiClient.get<UserResponse>(`/users/${id}`);
}

export async function createUser(data: CreateUserPayload) {
  return apiClient.post<UserResponse>('/users', data);
}

export async function updateUser(id: string, data: UpdateUserPayload) {
  return apiClient.patch<UserResponse>(`/users/${id}`, data);
}

export async function deleteUser(id: string) {
  return apiClient.delete<void>(`/users/${id}`);
}
