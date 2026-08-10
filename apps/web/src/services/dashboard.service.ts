import { apiClient } from './api-client';
import type { DashboardOverview } from '@/types/dashboard';

export interface DashboardOverviewResponse {
  success: boolean;
  data: DashboardOverview;
}

export async function getDashboardOverview() {
  return apiClient.get<DashboardOverviewResponse>(
    '/dashboard/overview',
  );
}
