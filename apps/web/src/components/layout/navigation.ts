import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  BrainCircuit,
  ShoppingBag,
  LayoutGrid,
  QrCode,
  MapPin,
  UtensilsCrossed,
  BellRing,
  BookOpen,
  Package,
  Store,
  Building2,
  Users,
  Receipt,
  Crown,
  User,
  Settings,
  ShieldAlert,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS, type Permission } from '@/types/permission';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
  permission?: Permission;
  group?: string; // Group header title
}

export const navigationItems: NavigationItem[] = [
  // Root Level
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  // V2 Analytics & BI Features (Commented out for V1)
  // { label: 'Analytics Engine', href: '/analytics', icon: BarChart3, permission: PERMISSIONS.DASHBOARD_READ },
  // { label: 'Custom Reports', href: '/reports', icon: FileSpreadsheet, permission: PERMISSIONS.DASHBOARD_READ },
  // { label: 'Forecasting Engine', href: '/forecasts', icon: BrainCircuit, permission: PERMISSIONS.DASHBOARD_READ },

  // Operations Group
  { label: 'Orders List', href: '/orders', icon: ShoppingBag, permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },
  { label: 'Tables Map', href: '/tables', icon: LayoutGrid, permission: PERMISSIONS.TABLES_READ, group: 'Operations' },
  { label: 'Table QR Codes', href: '/table-qrs', icon: QrCode, permission: PERMISSIONS.TABLES_READ, group: 'Operations' },
  { label: 'Dining Areas', href: '/dining-areas', icon: MapPin, permission: PERMISSIONS.DINING_AREAS_READ, group: 'Operations' },
  { label: 'Kitchen KDS', href: '/kitchen', icon: UtensilsCrossed, permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },
  { label: 'Waiter Screen', href: '/waiter', icon: BellRing, permission: PERMISSIONS.ORDERS_READ, group: 'Operations' },

  // Menu Catalog
  { label: 'Menus', href: '/menus', icon: BookOpen, permission: PERMISSIONS.MENUS_READ, group: 'Menu' },
  // V2 Inventory Feature (Commented out for V1)
  // { label: 'Inventory & Recipes', href: '/inventory', icon: Package, permission: PERMISSIONS.MENUS_READ, group: 'Menu' },

  // Administration Group
  { label: 'Restaurants', href: '/restaurants', icon: Store, permission: PERMISSIONS.RESTAURANTS_READ, group: 'Administration' },
  { label: 'Branches', href: '/branches', icon: Building2, permission: PERMISSIONS.BRANCHES_READ, group: 'Administration' },
  { label: 'Staff Users', href: '/users', icon: Users, permission: PERMISSIONS.USERS_READ, group: 'Administration' },

  // Finance Group
  { label: 'Cashier POS', href: '/cashier', icon: Receipt, permission: PERMISSIONS.ORDERS_READ, group: 'Finance' },
  { label: 'Subscriptions', href: '/subscriptions', icon: Crown, group: 'Finance' },

  // Settings & System Group
  { label: 'Platform Admin', href: '/platform-admin', icon: ShieldAlert, group: 'System' },
  { label: 'Support Desk', href: '/support', icon: Headphones, group: 'Support' },
  { label: 'Profile', href: '/profile', icon: User, group: 'Settings' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Settings' },
];
