import type { DiningArea } from './dining-area';

export type TableStatus = 'ACTIVE' | 'INACTIVE';

export interface RestaurantTable {
  id: string;
  diningAreaId: string;
  name: string;
  code: string;
  capacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
  diningArea?: DiningArea;
}
