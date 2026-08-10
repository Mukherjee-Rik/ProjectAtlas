import { apiClient } from './api-client';

export interface HealthData {
  status: string;
  service: string;
  timestamp: string;
}

export async function getHealth() {
  return apiClient.get<{
    success: boolean;
    data: HealthData;
  }>('/health');
}
