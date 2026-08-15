import { config } from '@/lib/config';
import { getAccessToken, setAccessToken, clearAuthStorage } from '@/lib/auth-storage';
import { getCurrentTenantId } from '@/lib/tenant-storage';
import { getCurrentRestaurantId } from '@/lib/restaurant-storage';
import { getCurrentBranchId } from '@/lib/branch-storage';
import { emitUnauthorizedEvent } from '@/lib/auth-events';
import { ApiError } from './api-error';
import type { ApiErrorResponse } from '@/types/api';

let isRefreshingToken = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

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

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Support secure HttpOnly cookies
  };

  const response = await fetch(`${config.apiUrl}${endpoint}`, fetchOptions);

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

    // Trigger token refresh silently on 401 (except on credentials auth endpoints)
    if (
      response.status === 401 &&
      endpoint !== '/auth/refresh' &&
      endpoint !== '/auth/login' &&
      endpoint !== '/auth/signup'
    ) {
      if (!isRefreshingToken) {
        isRefreshingToken = true;
        try {
          const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            const rawBody = await refreshRes.json();
            const newAccessToken = rawBody?.data?.accessToken;
            if (newAccessToken) {
              setAccessToken(newAccessToken);
              isRefreshingToken = false;
              onRefreshed(newAccessToken);
            } else {
              throw new Error('No access token returned');
            }
          } else {
            throw new Error('Refresh request rejected');
          }
        } catch (err) {
          isRefreshingToken = false;
          onRefreshed(null);
          clearAuthStorage();
          emitUnauthorizedEvent();
          throw new ApiError('Session expired', 401);
        }
      }

      // Queue concurrent requests while token is refreshing
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(new ApiError('Session expired', 401));
            return;
          }

          // Retry request with new accessToken
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set('Content-Type', 'application/json');
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          if (tenantId) retryHeaders.set('x-tenant-id', tenantId);
          if (restaurantId) retryHeaders.set('x-restaurant-id', restaurantId);
          if (branchId) retryHeaders.set('x-branch-id', branchId);

          fetch(`${config.apiUrl}${endpoint}`, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          })
            .then(async (res) => {
              const resText = await res.text();
              let resBody: any = undefined;
              if (resText) {
                try {
                  resBody = JSON.parse(resText);
                } catch {
                  resBody = resText;
                }
              }
              if (!res.ok) {
                const errBody = resBody as ApiErrorResponse | undefined;
                reject(new ApiError(errBody?.error ?? 'API request failed', res.status, errBody));
              } else {
                resolve(resBody as T);
              }
            })
            .catch(reject);
        });
      });
    }

    if (
      response.status === 401 &&
      endpoint !== '/auth/refresh' &&
      endpoint !== '/auth/login' &&
      endpoint !== '/auth/signup'
    ) {
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
