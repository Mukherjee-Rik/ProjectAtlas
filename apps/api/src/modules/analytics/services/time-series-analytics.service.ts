import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

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

@Injectable()
export class TimeSeriesAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates time-series points grouped by day or hour.
   */
  async getTimeSeries(
    restaurantId: string,
    filter: AnalyticsFilterDto,
    interval: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY',
  ): Promise<TimeSeriesPoint[]> {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const where: any = {
      restaurantId,
      createdAt: { gte: start, lte: end },
    };
    if (filter.branchId) where.branchId = filter.branchId;

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMap = new Map<
      string,
      {
        timestamp: string;
        label: string;
        grossSales: number;
        netSales: number;
        ordersCount: number;
        completedOrders: number;
        taxAmount: number;
        discountAmount: number;
      }
    >();

    // Helper for bucket keys
    const getBucketKey = (d: Date): { key: string; label: string } => {
      if (interval === 'HOURLY') {
        const key = d.toISOString().slice(0, 13) + ':00';
        const label = `${d.getHours()}:00`;
        return { key, label };
      }
      if (interval === 'MONTHLY') {
        const key = d.toISOString().slice(0, 7);
        const label = d.toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
        return { key, label };
      }
      // Default: DAILY
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
      });
      return { key, label };
    };

    // Pre-fill continuous timeline to ensure no missing gap days
    if (interval === 'DAILY') {
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endLimit = new Date(end);
      endLimit.setHours(23, 59, 59, 999);

      while (cursor <= endLimit) {
        const { key, label } = getBucketKey(cursor);
        if (!bucketMap.has(key)) {
          bucketMap.set(key, {
            timestamp: key,
            label,
            grossSales: 0,
            netSales: 0,
            ordersCount: 0,
            completedOrders: 0,
            taxAmount: 0,
            discountAmount: 0,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    orders.forEach((o) => {
      const { key, label } = getBucketKey(o.createdAt);
      const isCompleted = o.status === 'COMPLETED';
      const isCancelled = o.status === 'CANCELLED';

      const existing = bucketMap.get(key) || {
        timestamp: key,
        label,
        grossSales: 0,
        netSales: 0,
        ordersCount: 0,
        completedOrders: 0,
        taxAmount: 0,
        discountAmount: 0,
      };

      existing.grossSales += Number(o.totalAmount);
      existing.discountAmount += Number(o.discountAmount);
      existing.taxAmount += Number(o.taxAmount);
      existing.ordersCount += 1;

      if (isCompleted) existing.completedOrders += 1;
      if (!isCancelled) {
        existing.netSales += Number(o.subtotal) - Number(o.discountAmount);
      }

      bucketMap.set(key, existing);
    });

    return Array.from(bucketMap.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((b) => ({
        ...b,
        grossSales: Math.round(b.grossSales * 100) / 100,
        netSales: Math.round(b.netSales * 100) / 100,
        averageOrderValue:
          b.completedOrders > 0
            ? Math.round((b.grossSales / b.completedOrders) * 100) / 100
            : 0,
      }));
  }
}
