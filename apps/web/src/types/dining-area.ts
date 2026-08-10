export type DiningAreaStatus = 'ACTIVE' | 'INACTIVE';

export interface DiningArea {
  id: string;
  branchId: string;
  name: string;
  code: string;
  status: DiningAreaStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tables: number;
  };
}
