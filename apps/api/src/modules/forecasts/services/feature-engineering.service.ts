import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface DailyFeatureVector {
  date: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
  isWeekend: boolean;
  dayOfMonth: number;
  month: number;
  grossSales: number;
  netSales: number;
  totalOrders: number;
  averageOrderValue: number;
  lag1dSales: number;
  lag7dSales: number;
  lag14dSales: number;
  lag21dSales: number;
  lag28dSales: number;
  rolling7dMeanSales: number;
  rolling7dMeanOrders: number;
  rolling7dStdSales: number;
}

@Injectable()
export class FeatureEngineeringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prepares and cleans historical daily aggregates, filling gaps with zeros
   * and extracting deterministic lag and rolling features.
   */
  async buildHistoricalFeatures(
    restaurantId: string,
    branchId?: string,
    lookbackDays = 60,
  ): Promise<DailyFeatureVector[]> {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const where: any = {
      restaurantId,
      date: { gte: startDate, lt: endDate },
    };
    if (branchId) where.branchId = branchId;

    const aggregates = await this.prisma.dailySalesAggregate.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Map by YYYY-MM-DD
    const dateMap = new Map<
      string,
      { gross: number; net: number; orders: number; aov: number }
    >();
    aggregates.forEach((a) => {
      const key = a.date.toISOString().slice(0, 10);
      const existing = dateMap.get(key) || {
        gross: 0,
        net: 0,
        orders: 0,
        aov: 0,
      };
      existing.gross += Number(a.grossSales);
      existing.net += Number(a.netSales);
      existing.orders += a.totalOrders;
      existing.aov = existing.orders > 0 ? existing.gross / existing.orders : 0;
      dateMap.set(key, existing);
    });

    // If no aggregate records exist yet, fallback directly to raw Orders
    if (aggregates.length === 0) {
      const orders = await this.prisma.order.findMany({
        where: {
          restaurantId,
          ...(branchId ? { branchId } : {}),
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate },
        },
        select: {
          totalAmount: true,
          subtotal: true,
          discountAmount: true,
          createdAt: true,
        },
      });

      orders.forEach((o) => {
        const key = o.createdAt.toISOString().slice(0, 10);
        const existing = dateMap.get(key) || {
          gross: 0,
          net: 0,
          orders: 0,
          aov: 0,
        };
        const gross = Number(o.totalAmount);
        const net = Number(o.subtotal) - Number(o.discountAmount);
        existing.gross += gross;
        existing.net += net;
        existing.orders += 1;
        existing.aov =
          existing.orders > 0 ? existing.gross / existing.orders : 0;
        dateMap.set(key, existing);
      });
    }

    // Build continuous daily sequence
    const continuousDays: Array<{
      dateStr: string;
      dateObj: Date;
      gross: number;
      net: number;
      orders: number;
      aov: number;
    }> = [];
    const cur = new Date(startDate);
    while (cur < endDate) {
      const dateStr = cur.toISOString().slice(0, 10);
      const val = dateMap.get(dateStr) || {
        gross: 0,
        net: 0,
        orders: 0,
        aov: 0,
      };
      continuousDays.push({
        dateStr,
        dateObj: new Date(cur),
        gross: val.gross,
        net: val.net,
        orders: val.orders,
        aov: val.aov,
      });
      cur.setDate(cur.getDate() + 1);
    }

    // Generate Lag & Rolling features with strict zero-leakage
    const featureVectors: DailyFeatureVector[] = [];

    for (let i = 0; i < continuousDays.length; i++) {
      const day = continuousDays[i];
      const dObj = day.dateObj;
      const dow = dObj.getDay();

      const getLag = (daysBack: number) => {
        const targetIdx = i - daysBack;
        return targetIdx >= 0 ? continuousDays[targetIdx].gross : 0;
      };

      // Rolling 7-day stats (using strictly previous 7 days: i-7..i-1)
      const past7 = continuousDays.slice(Math.max(0, i - 7), i);
      const past7Sales = past7.map((p) => p.gross);
      const past7Orders = past7.map((p) => p.orders);

      const r7MeanSales =
        past7Sales.length > 0
          ? past7Sales.reduce((a, b) => a + b, 0) / past7Sales.length
          : 0;
      const r7MeanOrders =
        past7Orders.length > 0
          ? past7Orders.reduce((a, b) => a + b, 0) / past7Orders.length
          : 0;

      const variance =
        past7Sales.length > 1
          ? past7Sales.reduce(
              (sum, val) => sum + Math.pow(val - r7MeanSales, 2),
              0,
            ) /
            (past7Sales.length - 1)
          : 0;
      const r7StdSales = Math.sqrt(variance);

      featureVectors.push({
        date: day.dateStr,
        dayOfWeek: dow,
        isWeekend: dow === 0 || dow === 6,
        dayOfMonth: dObj.getDate(),
        month: dObj.getMonth() + 1,
        grossSales: day.gross,
        netSales: day.net,
        totalOrders: day.orders,
        averageOrderValue: day.aov,
        lag1dSales: getLag(1),
        lag7dSales: getLag(7),
        lag14dSales: getLag(14),
        lag21dSales: getLag(21),
        lag28dSales: getLag(28),
        rolling7dMeanSales: Math.round(r7MeanSales * 100) / 100,
        rolling7dMeanOrders: Math.round(r7MeanOrders * 100) / 100,
        rolling7dStdSales: Math.round(r7StdSales * 100) / 100,
      });
    }

    return featureVectors;
  }
}
