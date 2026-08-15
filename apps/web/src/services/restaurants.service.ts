import { apiClient } from './api-client';
import type { Restaurant } from '@/types/restaurant';

export interface AdminRestaurantSummary {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantName: string;
  planName: string;
  planStatus: string;
  branchesCount: number;
  tablesCount: number;
  totalOrders: number;
  completedOrders: number;
  totalSales: number;
}

export interface AdminRestaurantDetail {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  subscription: {
    id: string;
    planName: string;
    planPrice: number;
    planFeatures: string[];
    planLimits: Record<string, number>;
    status: string;
    trialEnd?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
  salesMetrics: {
    totalSales: number;
    completedSales: number;
    totalOrdersCount: number;
    completedOrdersCount: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  };
  usersAndPermissions: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    membershipRole: string;
    systemRole: string;
    status: string;
    joinedAt: string;
  }>;
  branches: Array<{
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    diningAreas: Array<{
      id: string;
      name: string;
      tablesCount: number;
    }>;
  }>;
  tables: Array<{
    id: string;
    name: string;
    code: string;
    capacity: number;
    status: string;
    publicToken: string;
    diningAreaName: string;
    branchName: string;
    hasActiveSession: boolean;
  }>;
  menusSummary: {
    totalMenus: number;
    totalCategories: number;
    totalMenuItems: number;
    menus: Array<{
      id: string;
      name: string;
      code: string;
      status: string;
      categoriesCount: number;
    }>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    tableName: string;
    itemsCount: number;
    createdAt: string;
  }>;
  supportTickets: Array<{
    id: string;
    ticketNumber: string;
    category: string;
    priority: string;
    status: string;
    subject: string;
    createdAt: string;
    resolvedAt?: string | null;
  }>;
}

export function getRestaurants() {
  return apiClient.get<{ success: boolean; data: Restaurant[] }>('/restaurants');
}

export function getAdminRestaurants() {
  return apiClient.get<{ success: boolean; data: AdminRestaurantSummary[] }>('/restaurants/admin/all');
}

export function getAdminRestaurantDetail(id: string) {
  return apiClient.get<{ success: boolean; data: AdminRestaurantDetail }>(`/restaurants/admin/details/${id}`);
}

