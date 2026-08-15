export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',

  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  PROFILE_READ: 'profile.read',
  PROFILE_UPDATE: 'profile.update',

  TENANTS_READ: 'tenants.read',
  TENANTS_CREATE: 'tenants.create',

  RESTAURANTS_READ: 'restaurants.read',
  RESTAURANTS_CREATE: 'restaurants.create',

  TENANT_MEMBERSHIPS_READ: 'tenant-memberships.read',
  TENANT_MEMBERSHIPS_CREATE: 'tenant-memberships.create',
  TENANT_MEMBERSHIPS_UPDATE: 'tenant-memberships.update',
  TENANT_MEMBERSHIPS_DELETE: 'tenant-memberships.delete',

  BRANCHES_READ: 'branches.read',
  BRANCHES_CREATE: 'branches.create',
  BRANCHES_UPDATE: 'branches.update',
  BRANCHES_DELETE: 'branches.delete',

  DINING_AREAS_READ: 'dining-areas.read',
  DINING_AREAS_CREATE: 'dining-areas.create',
  DINING_AREAS_UPDATE: 'dining-areas.update',
  DINING_AREAS_DELETE: 'dining-areas.delete',

  TABLES_READ: 'tables.read',
  TABLES_CREATE: 'tables.create',
  TABLES_UPDATE: 'tables.update',
  TABLES_DELETE: 'tables.delete',

  MENUS_READ: 'menus.read',
  MENUS_CREATE: 'menus.create',
  MENUS_UPDATE: 'menus.update',
  MENUS_DELETE: 'menus.delete',

  MENU_CATEGORIES_READ: 'menu-categories.read',
  MENU_CATEGORIES_CREATE: 'menu-categories.create',
  MENU_CATEGORIES_UPDATE: 'menu-categories.update',
  MENU_CATEGORIES_DELETE: 'menu-categories.delete',

  MENU_ITEMS_READ: 'menu-items.read',
  MENU_ITEMS_CREATE: 'menu-items.create',
  MENU_ITEMS_UPDATE: 'menu-items.update',
  MENU_ITEMS_DELETE: 'menu-items.delete',

  TAX_RATES_READ: 'tax-rates.read',
  TAX_RATES_CREATE: 'tax-rates.create',
  TAX_RATES_UPDATE: 'tax-rates.update',
  TAX_RATES_DELETE: 'tax-rates.delete',

  MENU_ITEM_VARIANTS_CREATE: 'menu-item-variants.create',
  MENU_ITEM_VARIANTS_UPDATE: 'menu-item-variants.update',
  MENU_ITEM_VARIANTS_DELETE: 'menu-item-variants.delete',

  MENU_ITEM_ADDONS_CREATE: 'menu-item-addons.create',
  MENU_ITEM_ADDONS_UPDATE: 'menu-item-addons.update',
  MENU_ITEM_ADDONS_DELETE: 'menu-item-addons.delete',

  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
