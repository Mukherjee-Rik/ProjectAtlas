import type { User } from './user';

export interface DashboardOverview {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  recentUsers: User[];
}
