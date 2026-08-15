import type { DiningArea } from './dining-area';

export type TableStatus = 'ACTIVE' | 'INACTIVE';

export interface RestaurantTable {
  id: string;
  diningAreaId: string;
  publicToken: string;
  name: string;
  code: string;
  capacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
  diningArea?: DiningArea;
  customerSessions?: {
    id: string;
    sessionToken: string;
    status: string;
    startedAt: string;
    orders: {
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
    }[];
  }[];
}
