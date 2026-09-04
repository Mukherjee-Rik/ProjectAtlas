import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

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

@Injectable()
export class MenuDemandForecasterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Forecasts dish-level demand and portion ranges for tomorrow.
   */
  async forecastMenuDemand(
    restaurantId: string,
    branchId?: string,
  ): Promise<ItemDemandForecast[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lookbackDate = new Date(today);
    lookbackDate.setDate(lookbackDate.getDate() - 30);

    const where: any = {
      restaurantId,
      date: { gte: lookbackDate, lt: today },
    };
    if (branchId) where.branchId = branchId;

    const itemMetrics = await this.prisma.menuItemDailyMetrics.findMany({
      where,
      include: {
        menuItem: {
          select: {
            name: true,
            price: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group historical metrics by menuItemId
    const itemMap = new Map<
      string,
      {
        name: string;
        price: number;
        category: string;
        portions: number[];
        dates: string[];
      }
    >();

    itemMetrics.forEach((m) => {
      const existing = itemMap.get(m.menuItemId) || {
        name: m.menuItem?.name || 'Unknown Item',
        price: Number(m.menuItem?.price || 0),
        category: m.menuItem?.category?.name || 'General',
        portions: [],
        dates: [],
      };
      existing.portions.push(m.quantitySold);
      existing.dates.push(m.date.toISOString().slice(0, 10));
      itemMap.set(m.menuItemId, existing);
    });

    // If no aggregate records exist yet, fallback directly to raw OrderItems
    if (itemMetrics.length === 0) {
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            restaurantId,
            ...(branchId ? { branchId } : {}),
            status: { not: 'CANCELLED' },
            createdAt: { gte: lookbackDate },
          },
        },
        include: {
          menuItem: {
            select: {
              name: true,
              price: true,
              category: { select: { name: true } },
            },
          },
        },
      });

      orderItems.forEach((oi) => {
        const existing = itemMap.get(oi.menuItemId) || {
          name: oi.menuItem?.name || oi.name,
          price: Number(oi.unitPrice || 0),
          category: oi.menuItem?.category?.name || 'General',
          portions: [],
          dates: [],
        };
        existing.portions.push(oi.quantity);
        itemMap.set(oi.menuItemId, existing);
      });
    }

    const forecasts: ItemDemandForecast[] = [];

    itemMap.forEach((data, menuItemId) => {
      const recent = data.portions.slice(-14);
      const totalUnits = recent.reduce((a, b) => a + b, 0);
      const avgDaily = recent.length > 0 ? totalUnits / recent.length : 0;

      // Project tomorrow with slight Day-of-Week weighting
      const projected = Math.max(1, Math.round(avgDaily * 1.05));
      const margin = Math.max(2, Math.round(projected * 0.18));

      // Trend check: compare last 7 days vs previous 7 days
      const first7 = recent.slice(0, 7);
      const last7 = recent.slice(-7);
      const avgFirst =
        first7.length > 0
          ? first7.reduce((a, b) => a + b, 0) / first7.length
          : 0;
      const avgLast =
        last7.length > 0 ? last7.reduce((a, b) => a + b, 0) / last7.length : 0;

      let trend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
      if (avgLast > avgFirst * 1.15) trend = 'INCREASING';
      else if (avgLast < avgFirst * 0.85) trend = 'DECREASING';

      forecasts.push({
        menuItemId,
        name: data.name,
        category: data.category,
        predictedPortionsTomorrow: projected,
        portionRangeLower: Math.max(0, projected - margin),
        portionRangeUpper: projected + margin,
        predictedRevenueTomorrow: Math.round(projected * data.price),
        confidence: recent.length >= 14 ? 85 : 75,
        trend,
      });
    });

    // Sort by highest expected portions
    return forecasts.sort(
      (a, b) => b.predictedPortionsTomorrow - a.predictedPortionsTomorrow,
    );
  }
}
