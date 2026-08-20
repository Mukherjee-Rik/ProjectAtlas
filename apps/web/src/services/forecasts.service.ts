import { apiClient } from './api-client';

export interface ProjectedPoint {
  date: string;
  dayOfWeek: number;
  dayName: string;
  predictedSales: number;
  predictedOrders: number;
  predictedAov: number;
  lowerBoundSales: number;
  upperBoundSales: number;
  confidence: number;
}

export interface HourlyProjectedPoint {
  hour: number;
  timeLabel: string;
  predictedOrders: number;
  predictedSales: number;
  isPeak: boolean;
}

export interface SalesForecastResult {
  restaurantId: string;
  branchId?: string;
  modelVersion: string;
  horizon: string;
  startDate: string;
  endDate: string;
  summary: {
    tomorrowSales: number;
    tomorrowOrders: number;
    tomorrowAov: number;
    tomorrowSalesLower: number;
    tomorrowSalesUpper: number;
    tomorrowConfidence: number;
    totalHorizonSales: number;
    totalHorizonOrders: number;
  };
  dailyProjections: ProjectedPoint[];
  hourlyProjections: HourlyProjectedPoint[];
}

export interface MealPeriodForecast {
  periodId: string;
  label: string;
  timeRange: string;
  predictedSales: number;
  predictedOrders: number;
  sharePercentage: number;
  isPeakPeriod: boolean;
}

export interface ChannelForecast {
  channelId: string;
  label: string;
  predictedSales: number;
  predictedOrders: number;
  sharePercentage: number;
}

export interface DemandHeatmapCell {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  timeLabel: string;
  predictedOrders: number;
  intensity: 'LOW' | 'MODERATE' | 'HIGH' | 'PEAK';
}

export interface ExplainabilityFactor {
  name: string;
  impactPercentage: number;
  impactType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface ForecastExplanation {
  targetDate: string;
  dayName: string;
  predictedSales: number;
  comparisonBaselineSales: number;
  deltaPercentage: number;
  summaryText: string;
  factors: ExplainabilityFactor[];
}

export interface ItemDemandForecast {
  menuItemId: string;
  name: string;
  category: string;
  predictedPortionsTomorrow: number;
  portionRangeLower: number;
  portionRangeUpper: number;
  predictedRevenueTomorrow: number;
  confidence: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface ForecastVsActualRow {
  evalDate: string;
  dayName: string;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  accuracy: number;
  bias: 'OVER_PREDICTED' | 'UNDER_PREDICTED' | 'EXACT';
  modelVersion: string;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  wape: number;
  accuracyScore: number;
  biasSummary: string;
  sampleSize: number;
  evalPeriod: string;
  comparisonHistory: ForecastVsActualRow[];
}

export interface ModelBenchmarkResult {
  modelId: string;
  modelName: string;
  type: string;
  mae: number;
  rmse: number;
  wape: number;
  bias: number;
  accuracyScore: number;
  isChampion: boolean;
  status: 'ACTIVE' | 'EVALUATING';
}

export interface AiForecastAnswer {
  question: string;
  intent: string;
  headlineAnswer: string;
  supportingDetails: string[];
  confidence: number;
  dataPayload: Record<string, any>;
}

export const forecastsService = {
  getSalesForecast(params?: { branchId?: string; horizon?: '24H' | '48H' | '7D' | '14D' | '30D' | '90D' }) {
    const query = new URLSearchParams();
    if (params?.branchId) query.set('branchId', params.branchId);
    if (params?.horizon) query.set('horizon', params.horizon);
    return apiClient.get<{ success: boolean; data: SalesForecastResult }>(
      `/forecasts/sales${query.toString() ? `?${query.toString()}` : ''}`,
    );
  },

  getMealAndChannels(branchId?: string) {
    return apiClient.get<{ success: boolean; data: { mealPeriods: MealPeriodForecast[]; channels: ChannelForecast[] } }>(
      `/forecasts/meal-channels${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  getDemandHeatmap(branchId?: string) {
    return apiClient.get<{ success: boolean; data: DemandHeatmapCell[][] }>(
      `/forecasts/heatmap${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  explainForecast(branchId?: string) {
    return apiClient.get<{ success: boolean; data: ForecastExplanation }>(
      `/forecasts/explain${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  getMenuDemand(branchId?: string) {
    return apiClient.get<{ success: boolean; data: ItemDemandForecast[] }>(
      `/forecasts/demand${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  getAccuracy(branchId?: string) {
    return apiClient.get<{ success: boolean; data: AccuracyMetrics }>(
      `/forecasts/accuracy${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  benchmarkModels(branchId?: string) {
    return apiClient.get<{ success: boolean; data: ModelBenchmarkResult[] }>(
      `/forecasts/models/benchmark${branchId ? `?branchId=${branchId}` : ''}`,
    );
  },

  askAiQuery(question: string, branchId?: string) {
    return apiClient.post<{ success: boolean; data: AiForecastAnswer }>('/forecasts/ai/query', {
      question,
      branchId,
    });
  },

  generateForecast(data: { branchId?: string; horizon?: '7D' | '14D' | '30D'; modelVersion?: string }) {
    return apiClient.post<{ success: boolean; data: { salesForecast: SalesForecastResult; menuForecast: ItemDemandForecast[] } }>(
      '/forecasts/generate',
      data,
    );
  },
};
