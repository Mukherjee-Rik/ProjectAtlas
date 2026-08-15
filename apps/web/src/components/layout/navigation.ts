import { PERMISSIONS, type Permission } from '@/types/permission';

export interface NavigationItem {
  label: string;
  href: string;
  permission?: Permission;
  group?: string; // Group header title
}

export const navigationItems: NavigationItem[] = [
  // Root Level
  { label: 'Dashboard', href: '/dashboard', permission: PERMISSIONS.DASHBOARD_READ },

  // Operations Group
  { label: 'Orders List', href: '/orders', permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },
  { label: 'Tables Map', href: '/tables', permission: PERMISSIONS.TABLES_READ, group: 'Operations' },
  { label: 'Table QR Codes', href: '/table-qrs', permission: PERMISSIONS.TABLES_READ, group: 'Operations' },
  { label: 'Dining Areas', href: '/dining-areas', permission: PERMISSIONS.DINING_AREAS_READ, group: 'Operations' },
  { label: 'Kitchen KDS', href: '/kitchen', permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },
  { label: 'Waiter Screen', href: '/waiter', permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },

  // Menu Catalog
  { label: 'Menus', href: '/menus', permission: PERMISSIONS.MENUS_READ, group: 'Menu' },
  // [V2 FEATURE - Commented out for V1]
  // { label: 'Inventory & Recipes', href: '/inventory', permission: PERMISSIONS.MENUS_READ, group: 'Menu' },

  // Administration Group
  { label: 'Restaurants', href: '/restaurants', permission: PERMISSIONS.RESTAURANTS_READ, group: 'Administration' },
  { label: 'Branches', href: '/branches', permission: PERMISSIONS.BRANCHES_READ, group: 'Administration' },
  { label: 'Staff Users', href: '/users', permission: PERMISSIONS.USERS_READ, group: 'Administration' },

  // Finance Group
  { label: 'Cashier POS', href: '/cashier', permission: PERMISSIONS.ORDERS_READ, group: 'Finance' },
  { label: 'Subscriptions', href: '/subscriptions', group: 'Finance' },

  // Settings Group
  { label: 'Profile', href: '/profile', group: 'Settings' },
  { label: 'Settings', href: '/settings', group: 'Settings' },
];
