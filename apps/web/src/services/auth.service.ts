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

export function oauthLogin(payload: { provider: string; email: string; name?: string; token?: string; avatarUrl?: string }) {
  return apiClient.post<LoginResponse>('/auth/oauth', payload);
}

export function verifyOtp(payload: { challengeId: string; otp: string }) {
  return apiClient.post<LoginResponse>('/auth/verify-otp', payload);
}

export function resendOtp(payload: { challengeId: string }) {
  return apiClient.post<{ success: boolean; message: string }>('/auth/resend-otp', payload);
}

export async function forgotPassword(payload: { identifier: string }) {
  try {
    return await apiClient.post<{
      success: boolean;
      challengeId: string;
      phoneMasked: string;
      emailMasked: string;
      message: string;
    }>('/auth/forgot-password', payload);
  } catch (err: any) {
    // If backend returns 404/Cannot POST (e.g. against deployed remote instance prior to rebuild), fallback to Next.js route
    if (err?.status === 404 || String(err?.message || '').includes('Cannot POST') || String(err?.error || '').includes('Cannot POST')) {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Password reset request failed.');
      return data;
    }
    throw err;
  }
}

export async function resetPassword(payload: { challengeId: string; otp: string; newPassword: string }) {
  try {
    return await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', payload);
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || '').includes('Cannot POST') || String(err?.error || '').includes('Cannot POST')) {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Password reset failed.');
      return data;
    }
    throw err;
  }
}

export async function resendResetOtp(payload: { challengeId: string }) {
  try {
    return await apiClient.post<{ success: boolean; message: string }>('/auth/resend-reset-otp', payload);
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || '').includes('Cannot POST') || String(err?.error || '').includes('Cannot POST')) {
      const res = await fetch('/api/v1/auth/resend-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Resend code failed.');
      return data;
    }
    throw err;
  }
}