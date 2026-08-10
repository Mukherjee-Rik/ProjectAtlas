export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}
