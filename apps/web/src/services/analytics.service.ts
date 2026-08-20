import { apiClient } from './api-client';

export interface KpiCard {
  key: string;
  name: string;
  value: number;
  unit: 'INR' | 'PERCENT' | 'COUNT' | 'MINUTES';
  periodLabel: string;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface KpiResponse {
  success: boolean;
  data: {
    kpis: KpiCard[];
    metadata: {
      currentWindow: string;
      previousWindow: string;
    };
  };
}

export interface TimeSeriesPoint {
  timestamp: string;
  label: string;
  grossSales: number;
  netSales: number;
  ordersCount: number;
  completedOrders: number;
  averageOrderValue: number;
  taxAmount: number;
  discountAmount: number;
}

export interface TimeSeriesResponse {
  success: boolean;
  data: TimeSeriesPoint[];
}

export interface RevenueAnalyticsResponse {
  success: boolean;
  data: {
    financialSummary: {
      grossRevenue: number;
      netRevenue: number;
      settledRevenue: number;
      totalTaxes: number;
      totalDiscounts: number;
      totalRefunds: number;
      cancelledRevenue: number;
    };
    channelDistribution: Array<{
      channel: string;
      ordersCount: number;
      revenue: number;
      sharePercentage: number;
    }>;
    paymentMethodDistribution: Array<{
      method: string;
      transactionsCount: number;
      volume: number;
    }>;
    branchRevenueSummary: Array<{
      branchId: string;
      name: string;
      volume: number;
      orders: number;
      averageOrderValue: number;
    }>;
  };
}

export interface MenuItemPerformance {
  menuItemId: string;
  name: string;
  categoryName: string;
  price: number;
  dietaryType: string;
  unitsSold: number;
  totalRevenue: number;
  revenueContributionPercent: number;
  ordersCount: number;
  classification: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';
}

export interface MenuAnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      totalMenuItems: number;
      totalUnitsSold: number;
      totalMenuRevenue: number;
    };
    topSellingItems: MenuItemPerformance[];
    topRevenueItems: MenuItemPerformance[];
    categoryPerformance: Array<{
      categoryId: string;
      name: string;
      totalRevenue: number;
      unitsSold: number;
      itemsCount: number;
      revenueContributionPercent: number;
    }>;
    menuMatrix: {
      stars: MenuItemPerformance[];
      plowhorses: MenuItemPerformance[];
      puzzles: MenuItemPerformance[];
      dogs: MenuItemPerformance[];
    };
    allItems: MenuItemPerformance[];
  };
}

export interface CustomerCohortResponse {
  success: boolean;
  data: {
    summary: {
      totalCustomers: number;
      averageLifetimeValue: number;
      repeatRate: number;
    };
    segmentation: Array<{
      segment: string;
      customersCount: number;
      revenue: number;
    }>;
    cohortRetentionMatrix: Array<{
      cohortMonth: string;
      newCustomersCount: number;
      retentionPercentages: number[];
    }>;
  };
}

export interface BranchAnalyticsResponse {
  success: boolean;
  data: {
    totalBranches: number;
    totalNetworkRevenue: number;
    branches: Array<{
      branchId: string;
      name: string;
      code: string;
      city: string;
      grossRevenue: number;
      netRevenue: number;
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      averageOrderValue: number;
      cancellationRate: number;
      networkContributionPercent: number;
    }>;
  };
}

export interface StaffAnalyticsResponse {
  success: boolean;
  data: {
    activeStaffCount: number;
    staff: Array<{
      userId: string;
      name: string;
      email: string;
      role: string;
      ordersHandled: number;
      completions: number;
      cancellations: number;
      totalActions: number;
    }>;
  };
}

export interface DemandMatrixResponse {
  success: boolean;
  data: {
    totalOrdersSampled: number;
    peakHourSummary: {
      maxOrdersInSingleHour: number;
    };
    demandMatrix: Array<{
      dayOfWeek: number;
      dayName: string;
      hour: number;
      orderCount: number;
      totalVolume: number;
      intensity: number;
    }>;
  };
}

export interface DrillDownResponse {
  success: boolean;
  data: {
    dimension: string;
    results?: any[];
    ordersCount?: number;
    transactions?: Array<{
      id: string;
      orderNumber: string;
      status: string;
      source: string;
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
      totalAmount: number;
      tableName: string;
      branchName: string;
      createdAt: string;
      itemsCount: number;
      items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
    }>;
  };
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  filters: Record<string, any>;
  createdAt: string;
}

export interface SavedReportsResponse {
  success: boolean;
  data: SavedReport[];
}

export interface AnalyticsQueryFilter {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  comparisonPeriod?: string;
  interval?: string;
  dimension?: string;
  targetId?: string;
}

function buildQueryString(filter?: AnalyticsQueryFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.append('dateTo', filter.dateTo);
  if (filter.branchId) params.append('branchId', filter.branchId);
  if (filter.comparisonPeriod) params.append('comparisonPeriod', filter.comparisonPeriod);
  if (filter.interval) params.append('interval', filter.interval);
  if (filter.dimension) params.append('dimension', filter.dimension);
  if (filter.targetId) params.append('targetId', filter.targetId);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const analyticsService = {
  getKpis(filter?: AnalyticsQueryFilter) {
    return apiClient.get<KpiResponse>(`/analytics/kpis${buildQueryString(filter)}`);
  },
  getTimeSeries(filter?: AnalyticsQueryFilter) {
    return apiClient.get<TimeSeriesResponse>(`/analytics/time-series${buildQueryString(filter)}`);
  },
  getRevenue(filter?: AnalyticsQueryFilter) {
    return apiClient.get<RevenueAnalyticsResponse>(`/analytics/revenue${buildQueryString(filter)}`);
  },
  getMenuPerformance(filter?: AnalyticsQueryFilter) {
    return apiClient.get<MenuAnalyticsResponse>(`/analytics/menu${buildQueryString(filter)}`);
  },
  getCustomers() {
    return apiClient.get<CustomerCohortResponse>('/analytics/customers');
  },
  getBranches(filter?: AnalyticsQueryFilter) {
    return apiClient.get<BranchAnalyticsResponse>(`/analytics/branches${buildQueryString(filter)}`);
  },
  getStaff(filter?: AnalyticsQueryFilter) {
    return apiClient.get<StaffAnalyticsResponse>(`/analytics/staff${buildQueryString(filter)}`);
  },
  getDemandMatrix(filter?: AnalyticsQueryFilter) {
    return apiClient.get<DemandMatrixResponse>(`/analytics/demand-matrix${buildQueryString(filter)}`);
  },
  getDrillDown(filter: AnalyticsQueryFilter) {
    return apiClient.get<DrillDownResponse>(`/analytics/drilldown${buildQueryString(filter)}`);
  },
  getSavedReports() {
    return apiClient.get<SavedReportsResponse>('/analytics/reports');
  },
  saveReport(data: { name: string; description?: string; reportType: string; filters: Record<string, any> }) {
    return apiClient.post<{ success: boolean; data: SavedReport }>('/analytics/reports', data);
  },
};
