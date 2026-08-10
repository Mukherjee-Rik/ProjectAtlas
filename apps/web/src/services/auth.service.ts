import { apiClient } from './api-client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

export function login(credentials: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', credentials);
}
