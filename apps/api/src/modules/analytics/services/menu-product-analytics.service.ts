import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

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

@Injectable()
export class MenuProductAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuPerformance(restaurantId: string, filter: AnalyticsFilterDto) {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const whereOrder: any = {
      restaurantId,
      status: { not: 'CANCELLED' },
      createdAt: { gte: start, lte: end },
    };
    if (filter.branchId) whereOrder.branchId = filter.branchId;

    const [orderItems, menuItems] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { order: whereOrder },
        select: {
          menuItemId: true,
          quantity: true,
          totalPrice: true,
          orderId: true,
        },
      }),
      this.prisma.menuItem.findMany({
        where: { category: { menu: { restaurantId } } },
        include: {
          category: { select: { id: true, name: true } },
          recipe: {
            include: {
              recipeIngredients: {
                include: { ingredient: { select: { costPerUnit: true } } },
              },
            },
          },
        },
      }),
    ]);

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    const itemStats = new Map<
      string,
      { unitsSold: number; totalRevenue: number; uniqueOrders: Set<string> }
    >();

    let totalMenuRevenue = 0;
    let totalUnitsSold = 0;

    orderItems.forEach((oi) => {
      const rev = Number(oi.totalPrice);
      totalMenuRevenue += rev;
      totalUnitsSold += oi.quantity;

      const existing = itemStats.get(oi.menuItemId) || {
        unitsSold: 0,
        totalRevenue: 0,
        uniqueOrders: new Set<string>(),
      };
      existing.unitsSold += oi.quantity;
      existing.totalRevenue += rev;
      existing.uniqueOrders.add(oi.orderId);
      itemStats.set(oi.menuItemId, existing);
    });

    const averageUnitsPerItem =
      menuItems.length > 0 ? totalUnitsSold / menuItems.length : 0;
    const averageRevenuePerItem =
      menuItems.length > 0 ? totalMenuRevenue / menuItems.length : 0;

    // Build item performance array
    const performanceList: MenuItemPerformance[] = menuItems.map((m) => {
      const stats = itemStats.get(m.id) || {
        unitsSold: 0,
        totalRevenue: 0,
        uniqueOrders: new Set(),
      };
      const revenueContribution =
        totalMenuRevenue > 0
          ? (stats.totalRevenue / totalMenuRevenue) * 100
          : 0;

      // Classify matrix: High/Low Popularity (Units) vs High/Low Volume (Revenue)
      const isHighPopularity = stats.unitsSold >= averageUnitsPerItem;
      const isHighRevenue = stats.totalRevenue >= averageRevenuePerItem;

      let classification: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG' = 'DOG';
      if (isHighPopularity && isHighRevenue) classification = 'STAR';
      else if (isHighPopularity && !isHighRevenue) classification = 'PLOWHORSE';
      else if (!isHighPopularity && isHighRevenue) classification = 'PUZZLE';

      return {
        menuItemId: m.id,
        name: m.name,
        categoryName: m.category?.name || 'General',
        price: Number(m.price),
        dietaryType: m.dietaryType,
        unitsSold: stats.unitsSold,
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
        revenueContributionPercent: Math.round(revenueContribution * 100) / 100,
        ordersCount: stats.uniqueOrders.size,
        classification,
      };
    });

    // Category Level Aggregations
    const categoryStats = new Map<
      string,
      {
        categoryId: string;
        name: string;
        totalRevenue: number;
        unitsSold: number;
        itemsCount: number;
      }
    >();

    performanceList.forEach((item) => {
      const cat = item.categoryName;
      const existing = categoryStats.get(cat) || {
        categoryId: cat,
        name: cat,
        totalRevenue: 0,
        unitsSold: 0,
        itemsCount: 0,
      };
      existing.totalRevenue += item.totalRevenue;
      existing.unitsSold += item.unitsSold;
      existing.itemsCount += 1;
      categoryStats.set(cat, existing);
    });

    const categoryPerformance = Array.from(categoryStats.values()).map((c) => ({
      ...c,
      totalRevenue: Math.round(c.totalRevenue * 100) / 100,
      revenueContributionPercent:
        totalMenuRevenue > 0
          ? Math.round((c.totalRevenue / totalMenuRevenue) * 10000) / 100
          : 0,
    }));

    return {
      summary: {
        totalMenuItems: menuItems.length,
        totalUnitsSold,
        totalMenuRevenue: Math.round(totalMenuRevenue * 100) / 100,
      },
      topSellingItems: [...performanceList]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10),
      topRevenueItems: [...performanceList]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10),
      categoryPerformance: categoryPerformance.sort(
        (a, b) => b.totalRevenue - a.totalRevenue,
      ),
      menuMatrix: {
        stars: performanceList.filter((i) => i.classification === 'STAR'),
        plowhorses: performanceList.filter(
          (i) => i.classification === 'PLOWHORSE',
        ),
        puzzles: performanceList.filter((i) => i.classification === 'PUZZLE'),
        dogs: performanceList.filter((i) => i.classification === 'DOG'),
      },
      allItems: performanceList.sort((a, b) => b.totalRevenue - a.totalRevenue),
    };
  }
}
