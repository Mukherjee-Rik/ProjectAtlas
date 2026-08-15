import type { Permission } from '@/types/permission';

const ALL_PERMISSIONS: readonly Permission[] = [
  'dashboard.read',
  'users.read', 'users.create', 'users.update', 'users.delete',
  'profile.read', 'profile.update',
  'tenants.read', 'tenants.create',
  'restaurants.read', 'restaurants.create',
  'branches.read', 'branches.create', 'branches.update', 'branches.delete',
  'dining-areas.read', 'dining-areas.create', 'dining-areas.update', 'dining-areas.delete',
  'tables.read', 'tables.create', 'tables.update', 'tables.delete',
  'menus.read', 'menus.create', 'menus.update', 'menus.delete',
  'menu-categories.read', 'menu-categories.create', 'menu-categories.update', 'menu-categories.delete',
  'menu-items.read', 'menu-items.create', 'menu-items.update', 'menu-items.delete',
  'orders.read', 'orders.update',
];

const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  PLATFORM_ADMIN: ALL_PERMISSIONS,
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  MANAGER: [
    'dashboard.read',
    'users.read', 'users.create', 'users.update', 'users.delete',
    'profile.read', 'profile.update',
    'restaurants.read', 'branches.read',
    'dining-areas.read', 'dining-areas.create', 'dining-areas.update',
    'tables.read', 'tables.create', 'tables.update',
    'menus.read', 'menus.create', 'menus.update',
    'menu-categories.read', 'menu-categories.create', 'menu-categories.update',
    'menu-items.read', 'menu-items.create', 'menu-items.update',
    'orders.read', 'orders.update',
  ],
  STAFF: [
    'dashboard.read',
    'profile.read', 'profile.update',
    'restaurants.read', 'branches.read',
    'dining-areas.read', 'tables.read',
    'menus.read', 'menu-categories.read', 'menu-items.read',
    'orders.read', 'orders.update',
  ],
  WAITER: [
    'dashboard.read',
    'profile.read', 'profile.update',
    'dining-areas.read', 'tables.read',
    'menus.read', 'menu-categories.read', 'menu-items.read',
    'orders.read', 'orders.update',
  ],
  KITCHEN: [
    'dashboard.read',
    'profile.read',
    'orders.read', 'orders.update',
  ],
  USER: [
    'profile.read', 'profile.update',
    'restaurants.read', 'branches.read',
    'dining-areas.read', 'tables.read',
    'menus.read', 'menu-categories.read', 'menu-items.read',
    'orders.read', 'orders.update',
  ],
};

export function hasPermission(
  role: string | undefined,
  permission: Permission,
): boolean {
  if (!role) {
    return false;
  }

  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
