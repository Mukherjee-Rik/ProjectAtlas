import { apiClient } from './api-client';
import { getAccessToken } from '@/lib/auth-storage';
import type {
  AuthUser,
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

/**
 * Creates the first tenant and restaurant for the signed-in user.
 *
 * Separate from registerRestaurant because /auth/signup rejects an email that
 * already exists, which is always the case after an OAuth sign-in: the account
 * is created before the operator has ever named a restaurant.
 */
export async function createFirstRestaurant(payload: {
  restaurantName: string;
  phone?: string;
  address?: string;
}) {
  const token = getAccessToken();
  const res = await fetch('/api/v1/auth/onboarding/restaurant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Could not create the restaurant.');
  }
  return data as {
    success: boolean;
    alreadyOnboarded?: boolean;
    data: {
      accessToken?: string;
      user: AuthUser;
      tenant?: { id: string; name: string; slug: string };
      restaurant?: { id: string; name: string; slug: string };
      branch?: { id: string; name: string; code: string };
      memberships?: RestaurantMembershipInfo[];
    };
  };
}

export function getMemberships() {
  return apiClient.get<{ success: boolean; data: RestaurantMembershipInfo[] }>('/auth/memberships');
}

/**
 * True when the configured API answered as though it does not know the route.
 * NEXT_PUBLIC_API_URL can point the browser straight at an API deployment that
 * is older than this web build, and Nest replies 404 "Cannot POST /..." for a
 * route it was built without. Gateway statuses are treated the same way, since
 * an API that is mid-redeploy cannot serve the route either.
 *
 * ApiError exposes `statusCode`; `status` is read too so a rejection shaped by
 * a plain fetch is classified the same way.
 */
function isRouteMissingUpstream(err: unknown): boolean {
  const e = err as
    | { statusCode?: number; status?: number; message?: string; error?: string }
    | undefined;
  const status = e?.statusCode ?? e?.status;

  if (status === 404 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  return `${e?.message ?? ''} ${e?.error ?? ''}`.includes('Cannot POST');
}

export async function oauthLogin(payload: { provider: string; email: string; name?: string; token?: string; avatarUrl?: string }) {
  try {
    return await apiClient.post<LoginResponse>('/auth/oauth', payload);
  } catch (err: unknown) {
    if (!isRouteMissingUpstream(err)) {
      throw err;
    }

    // Same-origin Next.js route. It reaches the database directly, so sign-in
    // still completes while the upstream API is missing /auth/oauth. Being
    // same-origin also means the refreshToken cookie it sets is accepted
    // without a cross-origin negotiation.
    const res = await fetch('/api/v1/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'OAuth sign-in failed.');
    }
    return data as LoginResponse;
  }
}

/**
 * Persists a section of the onboarding wizard for the signed-in owner's
 * restaurant. Each section is independent and idempotent, so the wizard can
 * call this as each step is completed and revisiting a step rewrites rather
 * than duplicates.
 */
export async function saveOnboardingSetup(payload: {
  floor?: { diningAreaName?: string; seating: { seats: number; count: number }[] };
  menu?: {
    menuName?: string;
    categoryName?: string;
    dishName?: string;
    dishPrice?: number;
  };
  staff?: { email: string; role: string };
  payments?: Record<string, boolean>;
}) {
  const token = getAccessToken();
  const res = await fetch('/api/v1/auth/onboarding/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Could not save your setup details.');
  }
  return data as {
    success: boolean;
    data: {
      floor?: { tablesCreated: number; tablesTotal: number; coversTotal: number; skipped?: string };
      menu?: { menuId: string; categoryId: string; itemId: string | null };
      staff?: { email?: string; role?: string; skipped?: string };
      payments?: { saved: boolean; reason: string };
    };
  };
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