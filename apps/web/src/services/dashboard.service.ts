import { apiClient } from './api-client';
import type { DashboardOverview, DashboardAnalytics } from '@/types/dashboard';

export interface DashboardOverviewResponse {
  success: boolean;
  data: DashboardOverview;
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  data: DashboardAnalytics;
}

export async function getDashboardOverview(startDate?: string, endDate?: string) {
  const query = new URLSearchParams();
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  
  const queryString = query.toString();
  const url = `/dashboard/overview${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<DashboardOverviewResponse>(url);
}

export async function getDashboardAnalytics(startDate?: string, endDate?: string) {
  const query = new URLSearchParams();
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  
  const queryString = query.toString();
  const url = `/dashboard/analytics${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<DashboardAnalyticsResponse>(url);
}

export interface PlatformOverviewResponse {
  success: boolean;
  data: {
    metrics: {
      totalTenants: number;
      totalRestaurants: number;
      totalUsers: number;
      totalOrders: number;
      totalRevenue: number;
    };
    systemMetrics: {
      uptimeSeconds: number;
      memoryHeapUsedMB: number;
      memoryHeapTotalMB: number;
      apiLatencyMs: number;
      systemStatus: string;
    };
    recentGlobalOrders: {
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      restaurantName: string;
      branchName: string;
    }[];
  };
}

export async function getPlatformDashboardOverview(startDate?: string, endDate?: string) {
  const query = new URLSearchParams();
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  
  const queryString = query.toString();
  const url = `/dashboard/platform-overview${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<PlatformOverviewResponse>(url);
}
