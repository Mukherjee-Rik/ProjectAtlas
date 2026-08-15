import { apiClient } from './api-client';
import type { Tenant } from '@/types/tenant';

export function getTenants() {
  return apiClient.get<{ success: boolean; data: Tenant[] }>('/tenants');
}
