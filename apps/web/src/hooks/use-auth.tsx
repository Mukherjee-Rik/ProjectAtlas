'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AuthUser } from '@/types/auth';
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
} from '@/lib/auth-storage';
import { clearCurrentTenant } from '@/lib/tenant-storage';
import { clearCurrentRestaurant } from '@/lib/restaurant-storage';
import { clearCurrentBranch } from '@/lib/branch-storage';
import { AUTH_UNAUTHORIZED_EVENT } from '@/lib/auth-events';
import { apiClient } from '@/services/api-client';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function initAuth() {
      const storedToken = getAccessToken();
      const storedUser = getStoredUser<AuthUser>();

      if (storedToken && storedUser) {
        setAccessTokenState(storedToken);
        setUser(storedUser);
      }
      setIsLoading(false);
    }

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV !== 'production'
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    initAuth();

    function handleUnauthorized() {
      clearAuthStorage();
      clearCurrentTenant();
      clearCurrentRestaurant();
      clearCurrentBranch();
      setAccessTokenState(null);
      setUser(null);
    }

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
    };
  }, []);

  const loginUser = useCallback(
    (token: string, authenticatedUser: AuthUser) => {
      clearCurrentTenant();
      clearCurrentRestaurant();
      clearCurrentBranch();
      setAccessToken(token);
      setStoredUser(authenticatedUser);

      setAccessTokenState(token);
      setUser(authenticatedUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Failed to logout on backend', err);
    }
    clearAuthStorage();
    clearCurrentTenant();
    clearCurrentRestaurant();
    clearCurrentBranch();
    setAccessTokenState(null);
    setUser(null);
  }, []);

  // This is the outermost of the four providers, so an unmemoised value here
  // re-rendered every screen in the app — and re-ran every effect keyed on
  // `useAuth()` — on any state change anywhere above it.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!accessToken,
      isLoading,
      loginUser,
      logout,
    }),
    [user, accessToken, isLoading, loginUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}
