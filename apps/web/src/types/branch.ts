import type { Restaurant } from './restaurant';

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
  restaurant?: Restaurant;
}
