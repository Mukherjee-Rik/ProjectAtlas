export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'WAITER'
  | 'KITCHEN'
  | 'USER';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
