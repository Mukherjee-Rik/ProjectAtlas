export type RestaurantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Restaurant {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  createdAt: string;
  updatedAt: string;
}
