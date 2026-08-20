'use client';

import {
  createContext,
  useContext,
  useEffect,
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

  function loginUser(token: string, authenticatedUser: AuthUser) {
    setAccessToken(token);
    setStoredUser(authenticatedUser);

    setAccessTokenState(token);
    setUser(authenticatedUser);
  }

  async function logout() {
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
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        loginUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
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
