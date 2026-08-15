/**
 * Public API client for customer-facing pages (QR / ordering flow).
 *
 * Unlike the main apiClient (which goes through /api/proxy), this client
 * talks directly to the NestJS server using the same hostname the customer's
 * device used to load the page.  This means:
 *   - On the manager's laptop   → http://localhost:3000/api/v1
 *   - On a customer's phone     → http://192.168.x.x:3000/api/v1
 *
 * No auth headers are attached — these are unauthenticated public endpoints.
 */

import { config } from '@/lib/config';

function getPublicApiBaseUrl(): string {
  return config.apiUrl;
}

async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getPublicApiBaseUrl();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${baseUrl}${endpoint}`, {
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
    const err = (body as { error?: string } | undefined)?.error ?? 'Request failed';
    throw new Error(err);
  }

  return body as T;
}

export const publicApiClient = {
  get<T>(endpoint: string): Promise<T> {
    return publicRequest<T>(endpoint);
  },
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return publicRequest<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return publicRequest<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },
  delete<T>(endpoint: string): Promise<T> {
    return publicRequest<T>(endpoint, { method: 'DELETE' });
  },
};
