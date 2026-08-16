'use client';

import { useState, type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query';

import { ApiError } from '@/services/api-error';

/**
 * Requests travel browser → Next proxy → API → database in another region, so
 * a repeated fetch is expensive. These defaults favour showing cached data
 * immediately and revalidating in the background over blocking on the network.
 */
const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Data stays fresh long enough that moving between pages reuses it
      // instead of refetching the same rows.
      staleTime: 30_000,
      gcTime: 5 * 60_000,

      // Refetching on every window focus produced a burst of requests each
      // time an operator tabbed back in; the interval pollers already keep
      // live screens current.
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      refetchOnReconnect: true,

      retry: (failureCount, error) => {
        // Auth and validation failures will not succeed on a retry, and
        // retrying a 401 races the token-refresh flow.
        if (error instanceof ApiError) {
          if (error.statusCode === 401 || error.statusCode === 403) return false;
          if (error.statusCode >= 400 && error.statusCode < 500) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created in state so each browser session gets one client, and so a
  // server render never shares a cache between users.
  const [client] = useState(() => new QueryClient(queryConfig));

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
