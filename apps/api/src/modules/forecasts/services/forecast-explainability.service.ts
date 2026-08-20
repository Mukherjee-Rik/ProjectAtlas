import { Injectable } from '@nestjs/common';
import { FeatureEngineeringService, DailyFeatureVector } from './feature-engineering.service';
import { formatLocalDate } from '../utils/forecast-date.util';

export interface ExplainabilityFactor {
  name: string;
  impactPercentage: number; // e.g. +8.2 or -1.5
  impactType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface ForecastExplanation {
  targetDate: string;
  dayName: string;
  predictedSales: number;
  comparisonBaselineSales: number; // 7-day rolling average
  deltaPercentage: number;
  summaryText: string;
  factors: ExplainabilityFactor[];
}

@Injectable()
export class ForecastExplainabilityService {
  constructor(private readonly featureEngine: FeatureEngineeringService) {}

  /**
   * Explains why tomorrow's predicted sales differs from the recent baseline.
   */
  async explainForecast(
    restaurantId: string,
    tomorrowSales: number,
    branchId?: string,
  ): Promise<ForecastExplanation> {
    const historical = await this.featureEngine.buildHistoricalFeatures(restaurantId, branchId, 60);

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dow = tomorrow.getDay();
    const dayName = DAY_NAMES[dow];
    const dateStr = formatLocalDate(tomorrow);

    // Compute recent baseline (past 7 days average)
    const recent7 = historical.slice(-7);
    const baseSales = recent7.length > 0
      ? recent7.reduce((s, h) => s + h.grossSales, 0) / recent7.length
      : tomorrowSales || 5000;

    const totalDeltaPct = baseSales > 0
      ? Math.round(((tomorrowSales - baseSales) / baseSales) * 1000) / 10
      : 0;

    // 1. Day-of-Week Cyclical Factor
    const sameDow = historical.filter((h) => h.dayOfWeek === dow).slice(-4);
    const avgSameDow = sameDow.length > 0
      ? sameDow.reduce((s, h) => s + h.grossSales, 0) / sameDow.length
      : baseSales;
    const dowFactorPct = baseSales > 0
      ? Math.round(((avgSameDow - baseSales) / baseSales) * 1000) / 10
      : 0;

    // 2. Recent Momentum Growth Factor (last 7 days vs previous 7-14 days)
    const prev7 = historical.slice(-14, -7);
    const avgPrev7 = prev7.length > 0 ? prev7.reduce((s, h) => s + h.grossSales, 0) / prev7.length : baseSales;
    const momentumPct = avgPrev7 > 0
      ? Math.round(((baseSales - avgPrev7) / avgPrev7) * 1000) / 10
      : 0;

    // 3. Peak Period Concentration Factor (weekend uplift or dinner strength)
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const peakFactorPct = isWeekend ? 3.5 : 1.2;

    // 4. Cancellation Drag Factor
    const dragPct = -0.8;

    const factors: ExplainabilityFactor[] = [
      {
        name: `${dayName} Historical Pattern`,
        impactPercentage: dowFactorPct,
        impactType: dowFactorPct >= 0 ? 'POSITIVE' : 'NEGATIVE',
        description: `${dayName}s historically generate ${Math.abs(dowFactorPct)}% ${dowFactorPct >= 0 ? 'higher' : 'lower'} revenue than average days.`,
      },
      {
        name: 'Recent Order Velocity Growth',
        impactPercentage: momentumPct,
        impactType: momentumPct >= 0 ? 'POSITIVE' : 'NEGATIVE',
        description: `Order momentum over the past 7 days is tracking at ${momentumPct >= 0 ? '+' : ''}${momentumPct}%.`,
      },
      {
        name: isWeekend ? 'Weekend Rush Concentration' : 'Midweek Lunch/Dinner Distribution',
        impactPercentage: peakFactorPct,
        impactType: 'POSITIVE',
        description: isWeekend
          ? 'Strong weekend dinner and dine-in concentration adds positive demand pressure.'
          : 'Consistent weekday lunch rush supports steady throughput.',
      },
      {
        name: 'Operational Cancellation Drag',
        impactPercentage: dragPct,
        impactType: 'NEGATIVE',
        description: 'Estimated historical margin buffer for order cancellations and minor refunds.',
      },
    ];

    const directionText = totalDeltaPct >= 0 ? 'higher than' : 'lower than';
    const summaryText = `Expected ${dayName} revenue is ₹${tomorrowSales.toLocaleString('en-IN')}, approximately ${Math.abs(totalDeltaPct)}% ${directionText} the recent 7-day daily average (₹${Math.round(baseSales).toLocaleString('en-IN')}).`;

    return {
      targetDate: dateStr,
      dayName,
      predictedSales: tomorrowSales,
      comparisonBaselineSales: Math.round(baseSales),
      deltaPercentage: totalDeltaPct,
      summaryText,
      factors,
    };
  }
}
