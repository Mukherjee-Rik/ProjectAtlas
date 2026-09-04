import { Injectable, Logger } from '@nestjs/common';
import {
  FeatureEngineeringService,
  DailyFeatureVector,
} from './feature-engineering.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { formatLocalDate } from '../utils/forecast-date.util';

export interface ProjectedPoint {
  date: string;
  dayOfWeek: number;
  dayName: string;
  predictedSales: number;
  predictedOrders: number;
  predictedAov: number;
  lowerBoundSales: number;
  upperBoundSales: number;
  confidence: number; // e.g. 86.50
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

@Injectable()
export class ForecastingEngineService {
  private readonly logger = new Logger(ForecastingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureEngine: FeatureEngineeringService,
  ) {}

  /**
   * Generates multi-horizon sales and order forecasts.
   */
  async generateSalesForecast(
    restaurantId: string,
    branchId?: string,
    horizonDays = 7,
    modelVersion = 'seasonal-dow-v1',
  ): Promise<SalesForecastResult> {
    const historical = await this.featureEngine.buildHistoricalFeatures(
      restaurantId,
      branchId,
      60,
    );

    const DAY_NAMES = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate baseline standard error from recent history
    const recentSales = historical.slice(-14).map((h) => h.grossSales);
    const avgRecentSales =
      recentSales.length > 0
        ? recentSales.reduce((a, b) => a + b, 0) / recentSales.length
        : 1000;
    const stdDev =
      recentSales.length > 1
        ? Math.sqrt(
            recentSales.reduce(
              (sum, v) => sum + Math.pow(v - avgRecentSales, 2),
              0,
            ) /
              (recentSales.length - 1),
          )
        : avgRecentSales * 0.15;

    const baseStd = Math.max(stdDev, avgRecentSales * 0.08);

    const dailyProjections: ProjectedPoint[] = [];
    let totSales = 0;
    let totOrders = 0;

    const activeDays = historical.filter((h) => h.grossSales > 0);
    const avgActiveSales =
      activeDays.length > 0
        ? activeDays.reduce((a, b) => a + b.grossSales, 0) / activeDays.length
        : 3500;
    const avgActiveOrders =
      activeDays.length > 0
        ? activeDays.reduce((a, b) => a + b.totalOrders, 0) / activeDays.length
        : 25;

    for (let d = 1; d <= horizonDays; d++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + d);
      const targetDateStr = formatLocalDate(targetDate);
      const dow = targetDate.getDay();
      const isWeekend = dow === 0 || dow === 5 || dow === 6;

      // Find historical records matching this Day-of-Week with non-zero sales
      const dowMatches = historical
        .filter((h) => h.dayOfWeek === dow && h.grossSales > 0)
        .slice(-4);

      let predictedSales = 0;
      let predictedOrders = 0;

      if (dowMatches.length >= 1) {
        // Seasonal weights: 40%, 30%, 20%, 10%
        const weights = [0.4, 0.3, 0.2, 0.1].slice(0, dowMatches.length);
        const weightSum = weights.reduce((a, b) => a + b, 0);

        const revMatches = [...dowMatches].reverse();
        for (let i = 0; i < revMatches.length; i++) {
          const w = weights[i] / weightSum;
          predictedSales += revMatches[i].grossSales * w;
          predictedOrders += revMatches[i].totalOrders * w;
        }
      } else if (activeDays.length > 0) {
        // Fallback to active recent days average with weekend adjustment
        const multiplier = isWeekend ? 1.15 : 0.95;
        predictedSales = avgActiveSales * multiplier;
        predictedOrders = avgActiveOrders * multiplier;
      } else {
        // Cold start benchmark
        const multiplier = isWeekend ? 1.2 : 1.0;
        predictedSales = 3500 * multiplier;
        predictedOrders = 25 * multiplier;
      }

      // Smooth rounding
      predictedSales = Math.round(predictedSales);
      predictedOrders = Math.max(1, Math.round(predictedOrders));
      const aov = Math.round((predictedSales / predictedOrders) * 100) / 100;

      // Prediction interval grows slightly with horizon
      const horizonUncertaintyMultiplier = 1 + (d - 1) * 0.03;
      const margin = 1.645 * baseStd * horizonUncertaintyMultiplier;

      const lowerBoundSales = Math.max(0, Math.round(predictedSales - margin));
      const upperBoundSales = Math.round(predictedSales + margin);

      // Confidence score decreases gently over time horizon
      const baseConfidence =
        historical.length >= 30 ? 88 : historical.length >= 14 ? 80 : 72;
      const confidence = Math.max(
        60,
        Math.round((baseConfidence - (d - 1) * 0.6) * 10) / 10,
      );

      totSales += predictedSales;
      totOrders += predictedOrders;

      dailyProjections.push({
        date: targetDateStr,
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        predictedSales,
        predictedOrders,
        predictedAov: aov,
        lowerBoundSales,
        upperBoundSales,
        confidence,
      });
    }

    // Generate Diurnal Hourly Curve for Tomorrow
    const hourlyProjections = this.generateHourlyCurve(
      dailyProjections[0]?.predictedSales || 5000,
      dailyProjections[0]?.predictedOrders || 40,
    );

    const tomorrow = dailyProjections[0];

    return {
      restaurantId,
      branchId,
      modelVersion,
      horizon: `${horizonDays}D`,
      startDate: dailyProjections[0]?.date || formatLocalDate(today),
      endDate:
        dailyProjections[dailyProjections.length - 1]?.date ||
        formatLocalDate(today),
      summary: {
        tomorrowSales: tomorrow?.predictedSales || 0,
        tomorrowOrders: tomorrow?.predictedOrders || 0,
        tomorrowAov: tomorrow?.predictedAov || 0,
        tomorrowSalesLower: tomorrow?.lowerBoundSales || 0,
        tomorrowSalesUpper: tomorrow?.upperBoundSales || 0,
        tomorrowConfidence: tomorrow?.confidence || 85,
        totalHorizonSales: totSales,
        totalHorizonOrders: totOrders,
      },
      dailyProjections,
      hourlyProjections,
    };
  }

  /**
   * Distributes tomorrow's projected total into 24 hour operational bins.
   */
  private generateHourlyCurve(
    totalSales: number,
    totalOrders: number,
  ): HourlyProjectedPoint[] {
    // Restaurant diurnal distribution profile (Lunch peak 12-14, Dinner peak 19-21)
    const hourlyWeights = [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0, // 0..5
      0.01,
      0.02,
      0.04,
      0.05,
      0.06,
      0.08, // 6..11
      0.12,
      0.14,
      0.08,
      0.04,
      0.03,
      0.04, // 12..17 (Lunch peak at 13)
      0.07,
      0.11,
      0.1,
      0.06,
      0.03,
      0.01, // 18..23 (Dinner peak at 19-20)
    ];

    return hourlyWeights.map((w, h) => {
      const pSales = Math.round(totalSales * w);
      const pOrders = Math.round(totalOrders * w);
      const isPeak = w >= 0.1;
      const timeLabel = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;

      return {
        hour: h,
        timeLabel,
        predictedOrders: pOrders,
        predictedSales: pSales,
        isPeak,
      };
    });
  }
}
