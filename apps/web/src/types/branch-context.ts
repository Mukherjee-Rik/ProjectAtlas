export interface CurrentBranch {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
