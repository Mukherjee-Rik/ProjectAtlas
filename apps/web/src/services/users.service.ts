import { apiClient } from './api-client';
import type { User } from '@/types/user';

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export async function getUsers() {
  return apiClient.get<UsersResponse>('/users');
}

export async function getUserById(id: string) {
  return apiClient.get<UserResponse>(`/users/${id}`);
}

export async function createUser(
  data: CreateUserPayload,
) {
  return apiClient.post<UserResponse>(
    '/users',
    data,
  );
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload,
) {
  return apiClient.patch<UserResponse>(
    `/users/${id}`,
    data,
  );
}

export async function deleteUser(id: string) {
  return apiClient.delete<void>(
    `/users/${id}`,
  );
}
