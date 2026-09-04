import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  dayName: string;
  hour: number; // 0..23
  orderCount: number;
  totalVolume: number;
  intensity: number; // 0.0 to 1.0 relative heat
}

@Injectable()
export class OperationalDemandAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationalDemandMatrix(
    restaurantId: string,
    filter: AnalyticsFilterDto,
  ) {
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
        totalAmount: true,
        status: true,
      },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize 7 days x 24 hours grid
    const matrix: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        matrix.push({
          dayOfWeek: d,
          dayName: dayNames[d],
          hour: h,
          orderCount: 0,
          totalVolume: 0,
          intensity: 0,
        });
      }
    }

    const cellMap = new Map<string, HeatmapCell>();
    matrix.forEach((c) => cellMap.set(`${c.dayOfWeek}_${c.hour}`, c));

    let maxCellOrders = 0;
    orders.forEach((o) => {
      const d = o.createdAt.getDay();
      const h = o.createdAt.getHours();
      const key = `${d}_${h}`;
      const cell = cellMap.get(key);
      if (cell) {
        cell.orderCount += 1;
        cell.totalVolume += Number(o.totalAmount);
        if (cell.orderCount > maxCellOrders) maxCellOrders = cell.orderCount;
      }
    });

    // Compute relative heat intensity 0.0 - 1.0
    matrix.forEach((c) => {
      c.intensity =
        maxCellOrders > 0
          ? Math.round((c.orderCount / maxCellOrders) * 100) / 100
          : 0;
      c.totalVolume = Math.round(c.totalVolume * 100) / 100;
    });

    return {
      totalOrdersSampled: orders.length,
      peakHourSummary: {
        maxOrdersInSingleHour: maxCellOrders,
      },
      demandMatrix: matrix,
    };
  }
}
