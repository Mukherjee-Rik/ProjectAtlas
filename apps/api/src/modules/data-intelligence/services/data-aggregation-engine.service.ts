import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class DataAggregationEngineService {
  private readonly logger = new Logger(DataAggregationEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates orders for a specific restaurant, branch, and date into DailySalesAggregate & MenuItemDailyMetrics.
   */
  async aggregateDaily(
    restaurantId: string,
    branchId: string,
    targetDate: Date,
  ): Promise<void> {
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { tenantId: true },
    });
    if (!restaurant) return;

    // Fetch all orders for that date window
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        branchId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: true,
        refunds: true,
      },
    });

    if (orders.length === 0) {
      // Upsert zero-state aggregate
      await this.prisma.dailySalesAggregate.upsert({
        where: {
          restaurantId_branchId_date: {
            restaurantId,
            branchId,
            date: startOfDay,
          },
        },
        create: {
          tenantId: restaurant.tenantId,
          restaurantId,
          branchId,
          date: startOfDay,
          grossSales: 0,
          netSales: 0,
          taxAmount: 0,
          discountAmount: 0,
          refundAmount: 0,
          cancelledAmount: 0,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          dineInOrders: 0,
          takeoutOrders: 0,
          averageOrderValue: 0,
          uniqueCustomers: 0,
        },
        update: {
          grossSales: 0,
          netSales: 0,
          totalOrders: 0,
          completedOrders: 0,
        },
      });
      return;
    }

    let grossSales = 0;
    let netSales = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let refundAmount = 0;
    let cancelledAmount = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let dineInOrders = 0;
    let takeoutOrders = 0;
    const uniqueCustomerIds = new Set<string>();

    const itemAggregates: Record<
      string,
      {
        quantitySold: number;
        grossRevenue: number;
        discountImpact: number;
        ordersCount: number;
      }
    > = {};

    orders.forEach((ord) => {
      const isCompleted = ord.status === 'COMPLETED';
      const isCancelled = ord.status === 'CANCELLED';

      grossSales += Number(ord.totalAmount);
      discountAmount += Number(ord.discountAmount);
      taxAmount += Number(ord.taxAmount);

      if (isCancelled) {
        cancelledOrders += 1;
        cancelledAmount += Number(ord.totalAmount);
      } else {
        netSales += Number(ord.subtotal) - Number(ord.discountAmount);
      }

      if (isCompleted) {
        completedOrders += 1;
      }

      if (ord.tableId) {
        dineInOrders += 1;
      } else {
        takeoutOrders += 1;
      }

      if (ord.customerId) {
        uniqueCustomerIds.add(ord.customerId);
      } else if (ord.customerSessionId) {
        uniqueCustomerIds.add(ord.customerSessionId);
      }

      // Sum refunds
      ord.refunds.forEach((ref) => {
        if (ref.status === 'SUCCESS' || ref.status === 'PENDING') {
          refundAmount += Number(ref.amount);
        }
      });

      // Item rollups for non-cancelled orders
      if (!isCancelled) {
        ord.items.forEach((item) => {
          if (!itemAggregates[item.menuItemId]) {
            itemAggregates[item.menuItemId] = {
              quantitySold: 0,
              grossRevenue: 0,
              discountImpact: 0,
              ordersCount: 0,
            };
          }
          itemAggregates[item.menuItemId].quantitySold += item.quantity;
          itemAggregates[item.menuItemId].grossRevenue += Number(
            item.totalPrice,
          );
          itemAggregates[item.menuItemId].ordersCount += 1;
        });
      }
    });

    const averageOrderValue =
      completedOrders > 0 ? (grossSales - refundAmount) / completedOrders : 0;

    // 1. Upsert DailySalesAggregate
    await this.prisma.dailySalesAggregate.upsert({
      where: {
        restaurantId_branchId_date: {
          restaurantId,
          branchId,
          date: startOfDay,
        },
      },
      create: {
        tenantId: restaurant.tenantId,
        restaurantId,
        branchId,
        date: startOfDay,
        grossSales,
        netSales,
        taxAmount,
        discountAmount,
        refundAmount,
        cancelledAmount,
        totalOrders: orders.length,
        completedOrders,
        cancelledOrders,
        dineInOrders,
        takeoutOrders,
        averageOrderValue,
        uniqueCustomers: uniqueCustomerIds.size,
      },
      update: {
        grossSales,
        netSales,
        taxAmount,
        discountAmount,
        refundAmount,
        cancelledAmount,
        totalOrders: orders.length,
        completedOrders,
        cancelledOrders,
        dineInOrders,
        takeoutOrders,
        averageOrderValue,
        uniqueCustomers: uniqueCustomerIds.size,
        updatedAt: new Date(),
      },
    });

    // 2. Upsert MenuItemDailyMetrics
    for (const [menuItemId, data] of Object.entries(itemAggregates)) {
      await this.prisma.menuItemDailyMetrics.upsert({
        where: {
          restaurantId_branchId_menuItemId_date: {
            restaurantId,
            branchId,
            menuItemId,
            date: startOfDay,
          },
        },
        create: {
          tenantId: restaurant.tenantId,
          restaurantId,
          branchId,
          menuItemId,
          date: startOfDay,
          quantitySold: data.quantitySold,
          grossRevenue: data.grossRevenue,
          discountImpact: data.discountImpact,
          ordersCount: data.ordersCount,
        },
        update: {
          quantitySold: data.quantitySold,
          grossRevenue: data.grossRevenue,
          discountImpact: data.discountImpact,
          ordersCount: data.ordersCount,
          updatedAt: new Date(),
        },
      });
    }

    this.logger.debug(
      `Aggregated day ${startOfDay.toISOString().slice(0, 10)} for Branch ${branchId}: ${orders.length} orders, ₹${grossSales} gross sales`,
    );
  }

  /**
   * Backfill Routine: Ingests all historical V1 orders into canonical aggregates and customer profiles.
   */
  async backfillHistoricalData(restaurantId?: string): Promise<{
    processedDays: number;
    processedOrders: number;
    customersCreated: number;
  }> {
    this.logger.log(`Starting historical data backfill routine...`);
    const where: any = {};
    if (restaurantId) where.restaurantId = restaurantId;

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        restaurantId: true,
        branchId: true,
        createdAt: true,
      },
    });

    if (orders.length === 0) {
      return { processedDays: 0, processedOrders: 0, customersCreated: 0 };
    }

    // Identify unique (restaurantId, branchId, dateString) tuples
    const distinctDays = new Map<
      string,
      { restaurantId: string; branchId: string; date: Date }
    >();

    orders.forEach((o) => {
      const dateKey = `${o.restaurantId}_${o.branchId}_${o.createdAt.toISOString().slice(0, 10)}`;
      if (!distinctDays.has(dateKey)) {
        distinctDays.set(dateKey, {
          restaurantId: o.restaurantId,
          branchId: o.branchId,
          date: new Date(
            o.createdAt.getFullYear(),
            o.createdAt.getMonth(),
            o.createdAt.getDate(),
          ),
        });
      }
    });

    for (const item of distinctDays.values()) {
      await this.aggregateDaily(item.restaurantId, item.branchId, item.date);
    }

    this.logger.log(
      `Backfill complete: Aggregated ${distinctDays.size} distinct branch-day records from ${orders.length} orders.`,
    );

    return {
      processedDays: distinctDays.size,
      processedOrders: orders.length,
      customersCreated: 0,
    };
  }
}
