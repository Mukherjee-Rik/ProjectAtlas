'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Tenant } from '@/types/tenant';
import type { TenantMembership } from '@/types/tenant-membership';
import {
  getCurrentTenant,
  setCurrentTenant as saveCurrentTenant,
  clearCurrentTenant,
} from '@/lib/tenant-storage';
import { useAuth } from './use-auth';
import { apiClient } from '@/services/api-client';
import { onUnauthorizedEvent } from '@/lib/auth-events';

interface TenantContextValue {
  currentTenant: Tenant | null;
  currentTenantId: string | null;
  memberships: TenantMembership[];
  isLoadingMemberships: boolean;
  setCurrentTenant: (tenant: Tenant | null) => void;
  clearTenant: () => void;
  reloadMemberships: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const stored = getCurrentTenant();
    if (stored) {
      setCurrentTenantState(stored);
    }
  }, []);

  const clearTenant = useCallback(() => {
    setCurrentTenantState(null);
    setMemberships([]);
    clearCurrentTenant();
  }, []);

  const setCurrentTenant = useCallback((tenant: Tenant | null) => {
    setCurrentTenantState(tenant);
    if (tenant) {
      saveCurrentTenant(tenant);
    } else {
      clearCurrentTenant();
    }
  }, []);

  const reloadMemberships = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      return;
    }

    setIsLoadingMemberships(true);
    try {
      // Platform operators with PLATFORM_ADMIN role can access all platform tenants
      if (user.role === 'PLATFORM_ADMIN') {
        const response = await apiClient.get<{ success: boolean; data: Tenant[] }>('/tenants');
        const tenants = response.data ?? [];

        const adminMemberships: TenantMembership[] = tenants.map((t) => ({
          id: `admin-${t.id}`,
          tenantId: t.id,
          userId: user.id,
          role: 'ADMIN',
          createdAt: t.createdAt,
          tenant: t,
        }));

        setMemberships(adminMemberships);

        if (!currentTenant && tenants.length > 0) {
          setCurrentTenant(tenants[0]);
        }
      } else {
        const response = await apiClient.get<{
          success: boolean;
          data: TenantMembership[];
        }>(`/tenant-memberships/user/${user.id}`);

        const userMemberships = response.data ?? [];
        setMemberships(userMemberships);

        // Ensure currentTenant strictly belongs to the user's valid memberships
        const isValidCurrentTenant =
          currentTenant && userMemberships.some((m) => m.tenantId === currentTenant.id);

        if (!isValidCurrentTenant && userMemberships.length > 0 && userMemberships[0].tenant) {
          setCurrentTenant(userMemberships[0].tenant);
        } else if (userMemberships.length === 0) {
          clearTenant();
        }
      }
    } catch {
      // Ignore error if tenant memberships cannot be loaded yet
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [user, currentTenant, setCurrentTenant]);

  useEffect(() => {
    if (user) {
      void reloadMemberships();
    } else {
      clearTenant();
    }
  }, [user, reloadMemberships, clearTenant]);

  useEffect(() => {
    return onUnauthorizedEvent(() => {
      clearTenant();
    });
  }, [clearTenant]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentTenantId: currentTenant?.id ?? null,
        memberships,
        isLoadingMemberships,
        setCurrentTenant,
        clearTenant,
        reloadMemberships,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
