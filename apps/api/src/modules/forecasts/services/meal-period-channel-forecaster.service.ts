import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { MEAL_PERIODS, ORDER_CHANNELS } from '../constants/meal-periods.constants';

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
  dayOfWeek: number; // 0=Sun..6=Sat
  dayName: string;
  hour: number;
  timeLabel: string;
  predictedOrders: number;
  intensity: 'LOW' | 'MODERATE' | 'HIGH' | 'PEAK'; // 🟡, 🟠, 🔴, 🟣
}

@Injectable()
export class MealPeriodChannelForecasterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Projects channel and meal period breakdown for a target total sales volume.
   */
  async forecastMealPeriodsAndChannels(
    restaurantId: string,
    tomorrowTotalSales: number,
    tomorrowTotalOrders: number,
    branchId?: string,
  ): Promise<{ mealPeriods: MealPeriodForecast[]; channels: ChannelForecast[] }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lookback = new Date(today);
    lookback.setDate(lookback.getDate() - 30);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: lookback, lt: today },
        status: { not: 'CANCELLED' },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        totalAmount: true,
        tableId: true,
        source: true,
        createdAt: true,
      },
    });

    // 1. Calculate Meal Period Shares
    const periodTotals: Record<string, { sales: number; orders: number }> = {
      BREAKFAST: { sales: 0, orders: 0 },
      LUNCH: { sales: 0, orders: 0 },
      AFTERNOON: { sales: 0, orders: 0 },
      DINNER: { sales: 0, orders: 0 },
    };

    // 2. Calculate Channel Shares
    const channelTotals: Record<string, { sales: number; orders: number }> = {
      DINE_IN: { sales: 0, orders: 0 },
      TAKEOUT: { sales: 0, orders: 0 },
      DELIVERY: { sales: 0, orders: 0 },
      ONLINE: { sales: 0, orders: 0 },
    };

    let totalHistoricalSales = 0;
    let totalHistoricalOrders = orders.length;

    orders.forEach((o) => {
      const amt = Number(o.totalAmount);
      totalHistoricalSales += amt;
      const hour = o.createdAt.getHours();

      // Categorize meal period
      if (hour >= 7 && hour < 11) {
        periodTotals.BREAKFAST.sales += amt;
        periodTotals.BREAKFAST.orders += 1;
      } else if (hour >= 11 && hour < 16) {
        periodTotals.LUNCH.sales += amt;
        periodTotals.LUNCH.orders += 1;
      } else if (hour >= 16 && hour < 19) {
        periodTotals.AFTERNOON.sales += amt;
        periodTotals.AFTERNOON.orders += 1;
      } else {
        periodTotals.DINNER.sales += amt;
        periodTotals.DINNER.orders += 1;
      }

      // Categorize channel
      const isDelivery = o.source === 'PROVIDER_A' || o.source === 'PROVIDER_B';
      const ch = o.tableId ? 'DINE_IN' : (isDelivery ? 'DELIVERY' : 'TAKEOUT');
      if (channelTotals[ch]) {
        channelTotals[ch].sales += amt;
        channelTotals[ch].orders += 1;
      } else {
        channelTotals.DINE_IN.sales += amt;
        channelTotals.DINE_IN.orders += 1;
      }
    });

    // Default fallbacks if new restaurant
    const getPeriodShare = (pKey: string, defaultPct: number) =>
      totalHistoricalSales > 0 ? periodTotals[pKey].sales / totalHistoricalSales : defaultPct;

    const getChannelShare = (cKey: string, defaultPct: number) =>
      totalHistoricalSales > 0 ? channelTotals[cKey].sales / totalHistoricalSales : defaultPct;

    const periodShares = {
      BREAKFAST: getPeriodShare('BREAKFAST', 0.10),
      LUNCH: getPeriodShare('LUNCH', 0.35),
      AFTERNOON: getPeriodShare('AFTERNOON', 0.15),
      DINNER: getPeriodShare('DINNER', 0.40),
    };

    const channelShares = {
      DINE_IN: getChannelShare('DINE_IN', 0.65),
      TAKEOUT: getChannelShare('TAKEOUT', 0.20),
      DELIVERY: getChannelShare('DELIVERY', 0.15),
      ONLINE: getChannelShare('ONLINE', 0.00),
    };

    const mealPeriods: MealPeriodForecast[] = Object.values(MEAL_PERIODS).map((mp) => {
      const share = periodShares[mp.id as keyof typeof periodShares] || 0.25;
      const predSales = Math.round(tomorrowTotalSales * share);
      const predOrders = Math.round(tomorrowTotalOrders * share);
      return {
        periodId: mp.id,
        label: mp.label,
        timeRange: mp.description,
        predictedSales: predSales,
        predictedOrders: predOrders,
        sharePercentage: Math.round(share * 1000) / 10,
        isPeakPeriod: mp.id === 'LUNCH' || mp.id === 'DINNER',
      };
    });

    const channels: ChannelForecast[] = Object.values(ORDER_CHANNELS).map((ch) => {
      const share = channelShares[ch.id as keyof typeof channelShares] || 0;
      const predSales = Math.round(tomorrowTotalSales * share);
      const predOrders = Math.round(tomorrowTotalOrders * share);
      return {
        channelId: ch.id,
        label: ch.label,
        predictedSales: predSales,
        predictedOrders: predOrders,
        sharePercentage: Math.round(share * 1000) / 10,
      };
    }).filter((c) => c.sharePercentage > 0);

    return { mealPeriods, channels };
  }

  /**
   * Generates the 7x24 Operational Demand Intensity Heatmap matrix.
   */
  async generateDemandHeatmap(restaurantId: string, branchId?: string): Promise<DemandHeatmapCell[][]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lookback = new Date(today);
    lookback.setDate(lookback.getDate() - 30);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: lookback, lt: today },
        status: { not: 'CANCELLED' },
        ...(branchId ? { branchId } : {}),
      },
      select: { createdAt: true },
    });

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // 7 rows (days 0..6) x 24 cols (hours 0..23)
    const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const dayCounts: number[] = Array(7).fill(0);

    orders.forEach((o) => {
      const d = o.createdAt.getDay();
      const h = o.createdAt.getHours();
      counts[d][h] += 1;
    });

    // Approximate average orders per hour on that day of week (over 4 weeks)
    const matrix: DemandHeatmapCell[][] = [];

    for (let d = 0; d < 7; d++) {
      const row: DemandHeatmapCell[] = [];
      for (let h = 0; h < 24; h++) {
        const rawCount = counts[d][h];
        const avgHourly = Math.round((rawCount / 4.2) * 10) / 10; // ~4.2 weeks in 30 days
        const predictedOrders = Math.max(0, Math.round(avgHourly));

        let intensity: DemandHeatmapCell['intensity'] = 'LOW';
        if (predictedOrders >= 45) intensity = 'PEAK';
        else if (predictedOrders >= 25) intensity = 'HIGH';
        else if (predictedOrders >= 10) intensity = 'MODERATE';

        const timeLabel = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;

        row.push({
          dayOfWeek: d,
          dayName: DAY_NAMES[d],
          hour: h,
          timeLabel,
          predictedOrders,
          intensity,
        });
      }
      matrix.push(row);
    }

    return matrix;
  }
}
