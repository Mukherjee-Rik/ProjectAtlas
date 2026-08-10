import type { Tenant } from './tenant';

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  createdAt: string;
  tenant?: Tenant;
}
