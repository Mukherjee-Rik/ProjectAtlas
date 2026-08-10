import { PERMISSIONS, type Permission } from '@/types/permission';

export interface NavigationItem {
  label: string;
  href: string;
  permission?: Permission;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', permission: PERMISSIONS.DASHBOARD_READ },
  { label: 'Restaurants', href: '/restaurants', permission: PERMISSIONS.RESTAURANTS_READ },
  { label: 'Branches', href: '/branches', permission: PERMISSIONS.BRANCHES_READ },
  { label: 'Dining Areas', href: '/dining-areas', permission: PERMISSIONS.DINING_AREAS_READ },
  { label: 'Tables', href: '/tables', permission: PERMISSIONS.TABLES_READ },
  { label: 'Menus', href: '/menus', permission: PERMISSIONS.MENUS_READ },
  { label: 'Users', href: '/users', permission: PERMISSIONS.USERS_READ },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
];
