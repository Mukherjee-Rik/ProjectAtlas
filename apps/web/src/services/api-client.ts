import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth-storage';
import { getCurrentTenantId } from '@/lib/tenant-storage';
import { getCurrentRestaurantId } from '@/lib/restaurant-storage';
import { getCurrentBranchId } from '@/lib/branch-storage';
import { emitUnauthorizedEvent } from '@/lib/auth-events';
import { ApiError } from './api-error';
import type { ApiErrorResponse } from '@/types/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const tenantId = getCurrentTenantId();
  const restaurantId = getCurrentRestaurantId();
  const branchId = getCurrentBranchId();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (tenantId) {
    headers.set('x-tenant-id', tenantId);
  }

  if (restaurantId) {
    headers.set('x-restaurant-id', restaurantId);
  }

  if (branchId) {
    headers.set('x-branch-id', branchId);
  }

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let body: unknown = undefined;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse | undefined;

    if (response.status === 401) {
      emitUnauthorizedEvent();
    }

    throw new ApiError(
      errorBody?.error ?? 'API request failed',
      response.status,
      errorBody,
    );
  }

  return body as T;
}

export const apiClient = {
  get<T>(endpoint: string) {
    return request<T>(endpoint);
  },

  post<T>(endpoint: string, data?: unknown) {
    return request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(endpoint: string, data?: unknown) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};
