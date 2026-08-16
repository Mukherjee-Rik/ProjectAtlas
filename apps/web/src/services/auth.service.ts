import { apiClient } from './api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRestaurantRequest,
  RegisterRestaurantResponse,
  RestaurantMembershipInfo,
} from '@/types/auth';

export function login(credentials: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', credentials);
}

export function registerRestaurant(payload: RegisterRestaurantRequest) {
  return apiClient.post<RegisterRestaurantResponse>('/auth/signup', payload);
}

export function getMemberships() {
  return apiClient.get<{ success: boolean; data: RestaurantMembershipInfo[] }>('/auth/memberships');
}