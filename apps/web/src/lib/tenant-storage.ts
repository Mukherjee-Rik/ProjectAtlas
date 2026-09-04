import type { Tenant } from '@/types/tenant';

const TENANT_STORAGE_KEY = 'kafei_current_tenant';
const LEGACY_TENANT_STORAGE_KEY = 'atlas_current_tenant';

export function getCurrentTenantId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(TENANT_STORAGE_KEY) || localStorage.getItem(LEGACY_TENANT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentTenant(): Tenant | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(TENANT_STORAGE_KEY) || localStorage.getItem(LEGACY_TENANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentTenant(tenant: Tenant): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
  }
}

export function clearCurrentTenant(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TENANT_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TENANT_STORAGE_KEY);
  }
}
