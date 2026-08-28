import { apiClient } from './api-client';

export interface ReportConfiguration {
  metrics: string[];
  dimensions: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  dateRange: {
    preset: string;
    customFrom?: string;
    customTo?: string;
  };
  sorting?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
  limit?: number;
  visualization: {
    type: string;
    title?: string;
  };
}

export interface CustomReport {
  id: string;
  tenantId: string;
  restaurantId: string;
  createdById: string;
  name: string;
  description?: string;
  dataSource: string;
  configuration: ReportConfiguration;
  visibility: string;
  branchId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  schedules?: Array<{
    id: string;
    name: string;
    frequency: string;
    enabled: boolean;
    nextRunAt?: string;
  }>;
  executions?: Array<{
    id: string;
    triggeredBy: string;
    status: string;
    durationMs: number;
    recordsCount: number;
    createdAt: string;
  }>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  category: string;
  configuration: ReportConfiguration;
}

export interface ReportExecutionResult {
  reportName: string;
  dataSource: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  visualization: {
    type: string;
    title?: string;
  };
  columns: Array<{ key: string; label: string; unit?: string }>;
  rows: Array<Record<string, any>>;
  summary: Record<string, any>;
}

export const reportsService = {
  listReports() {
    return apiClient.get<{ success: boolean; data: CustomReport[] }>('/reports');
  },
  getReport(id: string) {
    return apiClient.get<{ success: boolean; data: CustomReport }>(`/reports/${id}`);
  },
  createReport(data: {
    name: string;
    description?: string;
    dataSource: string;
    configuration: ReportConfiguration;
    visibility?: string;
    branchId?: string;
  }) {
    return apiClient.post<{ success: boolean; data: CustomReport }>('/reports', data);
  },
  updateReport(id: string, data: Partial<CustomReport>) {
    return apiClient.patch<{ success: boolean; data: CustomReport }>(`/reports/${id}`, data);
  },
  deleteReport(id: string) {
    return apiClient.delete<{ success: boolean }>(`/reports/${id}`);
  },
  duplicateReport(id: string) {
    return apiClient.post<{ success: boolean; data: CustomReport }>(`/reports/${id}/duplicate`);
  },
  previewReport(data: { name: string; dataSource: string; configuration: ReportConfiguration }) {
    return apiClient.post<{ success: boolean; data: ReportExecutionResult }>('/reports/preview', data);
  },
  runReport(id: string, branchOverride?: string) {
    return apiClient.post<{ success: boolean; data: ReportExecutionResult }>(
      `/reports/${id}/run${branchOverride ? `?branchId=${branchOverride}` : ''}`,
    );
  },
  listTemplates() {
    return apiClient.get<{ success: boolean; data: ReportTemplate[] }>('/reports/templates');
  },
  useTemplate(templateId: string, customName?: string) {
    return apiClient.post<{ success: boolean; data: CustomReport }>(`/reports/templates/${templateId}/use`, {
      name: customName,
    });
  },
  createSchedule(reportId: string, data: any) {
    return apiClient.post<{ success: boolean; data: any }>(`/reports/${reportId}/schedules`, data);
  },
  deleteSchedule(scheduleId: string) {
    return apiClient.delete<{ success: boolean }>(`/reports/schedules/${scheduleId}`);
  },
  exportReportCsv(id: string) {
    return apiClient.get<string>(`/reports/${id}/export`);
  },
};
