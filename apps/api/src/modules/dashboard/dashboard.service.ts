import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

function parseStartOfDay(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match) {
    const [, y, m, d] = match;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));
  }
  const parsed = new Date(`${dateStr}T00:00:00.000`);
  return isNaN(parsed.getTime()) ? (isNaN(new Date(dateStr).getTime()) ? undefined : new Date(dateStr)) : parsed;
}

function parseEndOfDay(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match) {
    const [, y, m, d] = match;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999));
  }
  const parsed = new Date(`${dateStr}T23:59:59.999`);
  return isNaN(parsed.getTime()) ? (isNaN(new Date(dateStr).getTime()) ? undefined : new Date(dateStr)) : parsed;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurantOverview(
    user?: any,
    restaurantId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    let tenantId: string | undefined;

    // 1. If restaurantId was provided, verify it exists, retrieve tenantId, and verify user membership
    if (restaurantId) {
      const rest = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, tenantId: true },
      });
      if (rest) {
        if (user?.role !== 'PLATFORM_ADMIN' && user?.id) {
          const hasMembership = await this.prisma.tenantMembership.findUnique({
            where: {
              userId_tenantId: {
                userId: user.id,
                tenantId: rest.tenantId,
              },
            },
            select: { id: true },
          });
          if (!hasMembership) {
            return {
              metrics: {
                totalOrders: 0,
                totalSales: 0,
                activeTables: 0,
                menuItems: 0,
                staffCount: 0,
              },
              recentOrders: [],
              restaurantStaff: [],
            };
          }
        }
        restaurantId = rest.id;
        tenantId = rest.tenantId;
      } else {
        restaurantId = undefined;
      }
    }

    // 2. If restaurantId is missing, resolve strictly from user's tenant memberships (never global findFirst)
    if (!restaurantId && user?.id) {
      const membership = await this.prisma.tenantMembership.findFirst({
        where: { userId: user.id },
        include: { tenant: { include: { restaurants: true } } },
      });
      if (membership?.tenant?.restaurants?.[0]) {
        restaurantId = membership.tenant.restaurants[0].id;
        tenantId = membership.tenantId;
      }
    }

    // If still no restaurant (e.g. fresh user with no restaurants yet), return clean empty state
    if (!restaurantId) {
      return {
        metrics: {
          totalOrders: 0,
          totalSales: 0,
          activeTables: 0,
          menuItems: 0,
          staffCount: 0,
        },
        recentOrders: [],
        restaurantStaff: [],
      };
    }

    const whereOrder: any = {};
    if (restaurantId) whereOrder.restaurantId = restaurantId;
    if (branchId) whereOrder.branchId = branchId;

    if (startDate || endDate) {
      const gte = parseStartOfDay(startDate);
      const lte = parseEndOfDay(endDate);
      whereOrder.createdAt = {};
      if (gte) whereOrder.createdAt.gte = gte;
      if (lte) whereOrder.createdAt.lte = lte;
    }

    const whereSalesOrder: any = {
      ...whereOrder,
      status: { not: 'CANCELLED' },
    };

    const whereTables: any = {};
    if (restaurantId) {
      whereTables.diningArea = { branch: { restaurantId } };
    }
    if (branchId) {
      whereTables.diningArea = { branchId };
    }

    const whereMenuItems: any = {};
    if (restaurantId) {
      whereMenuItems.category = { menu: { restaurantId } };
    }

    const [
      totalOrders,
      salesAggregate,
      activeTablesCount,
      menuItemsCount,
      staffCount,
      recentOrders,
      restaurantStaff,
    ] = await Promise.all([
      restaurantId ? this.prisma.order.count({ where: whereOrder }) : 0,

      restaurantId
        ? this.prisma.order.aggregate({
            where: whereSalesOrder,
            _sum: { totalAmount: true },
          })
        : { _sum: { totalAmount: null } },

      restaurantId ? this.prisma.table.count({ where: { ...whereTables, status: 'ACTIVE' } }) : 0,

      restaurantId ? this.prisma.menuItem.count({ where: { ...whereMenuItems, status: 'ACTIVE' } }) : 0,

      tenantId ? this.prisma.tenantMembership.count({ where: { tenantId } }) : 0,

      restaurantId
        ? this.prisma.order.findMany({
            where: whereOrder,
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              table: { select: { name: true, code: true } },
              _count: { select: { items: true } },
            },
          })
        : [],

      tenantId
        ? this.prisma.tenantMembership.findMany({
            where: { tenantId },
            take: 5,
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          })
        : [],
    ]);

    const totalSales = salesAggregate._sum.totalAmount
      ? Number(salesAggregate._sum.totalAmount)
      : 0;

    return {
      metrics: {
        totalOrders,
        totalSales,
        activeTables: activeTablesCount,
        menuItems: menuItemsCount,
        staffCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        tableName: o.table ? `${o.table.name} (${o.table.code})` : 'Takeout / Direct',
        itemCount: o._count.items,
      })),
      restaurantStaff: restaurantStaff.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        status: m.user.status,
        joinedAt: m.user.createdAt,
      })),
    };
  }

  async getRestaurantAnalytics(
    user?: any,
    restaurantId?: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. If restaurantId was provided, verify it exists and verify user membership
    if (restaurantId) {
      const rest = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, tenantId: true },
      });
      if (rest) {
        if (user?.role !== 'PLATFORM_ADMIN' && user?.id) {
          const hasMembership = await this.prisma.tenantMembership.findUnique({
            where: {
              userId_tenantId: {
                userId: user.id,
                tenantId: rest.tenantId,
              },
            },
            select: { id: true },
          });
          if (!hasMembership) {
            restaurantId = undefined;
          }
        }
      } else {
        restaurantId = undefined;
      }
    }

    // 2. If restaurantId is missing, resolve strictly from user's tenant memberships
    if (!restaurantId && user?.id) {
      const membership = await this.prisma.tenantMembership.findFirst({
        where: { userId: user.id },
        include: { tenant: { include: { restaurants: true } } },
      });
      if (membership?.tenant?.restaurants?.[0]) {
        restaurantId = membership.tenant.restaurants[0].id;
      }
    }

    if (!restaurantId) {
      return {
        metrics: {
          totalOrders: 0,
          totalRevenue: 0,
          totalSubtotal: 0,
          totalTaxAmount: 0,
          totalDiscountAmount: 0,
          netRevenue: 0,
          averageOrderValue: 0,
          averageTaxPerOrder: 0,
          effectiveTaxRate: 0,
          dineInOrdersCount: 0,
          takeoutOrdersCount: 0,
          totalItemsCount: 0,
          averageItemsPerOrder: 0,
          highestOrderAmount: 0,
          lowestOrderAmount: 0,
          ticketDistribution: { under500: 0, between500And1000: 0, above1000: 0 },
          topTablesBySpend: [],
          salesTrend: [],
          statusDistribution: [],
          topItems: [],
        },
      };
    }

    const whereOrder: any = {
      status: { not: 'CANCELLED' },
    };
    if (restaurantId) whereOrder.restaurantId = restaurantId;
    if (branchId) whereOrder.branchId = branchId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let start: Date = parseStartOfDay(startDate) ?? thirtyDaysAgo;
    let end: Date = parseEndOfDay(endDate) ?? new Date();

    whereOrder.createdAt = {
      gte: start,
      lte: end,
    };

    const orders = await this.prisma.order.findMany({
      where: whereOrder,
      include: {
        table: {
          select: {
            name: true,
            code: true,
          },
        },
        items: {
          select: {
            name: true,
            quantity: true,
            totalPrice: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Calculate General & Itemized Revenue Metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalSubtotal = orders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
    const totalTaxAmount = orders.reduce((sum, o) => sum + Number(o.taxAmount || 0), 0);
    const totalDiscountAmount = orders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
    const netRevenue = totalSubtotal - totalDiscountAmount;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageTaxPerOrder = totalOrders > 0 ? totalTaxAmount / totalOrders : 0;
    const effectiveTaxRate = totalSubtotal > 0 ? (totalTaxAmount / totalSubtotal) * 100 : 0;
    const dineInOrdersCount = orders.filter((o) => o.tableId !== null).length;
    const takeoutOrdersCount = orders.filter((o) => o.tableId === null).length;

    const totalItemsCount = orders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
    const averageItemsPerOrder = totalOrders > 0 ? totalItemsCount / totalOrders : 0;
    const orderAmounts = orders.map((o) => Number(o.totalAmount || 0));
    const highestOrderAmount = orderAmounts.length > 0 ? Math.max(...orderAmounts) : 0;
    const lowestOrderAmount = orderAmounts.length > 0 ? Math.min(...orderAmounts) : 0;

    const ticketDistribution = {
      under500: orders.filter((o) => Number(o.totalAmount || 0) < 500).length,
      between500And1000: orders.filter((o) => Number(o.totalAmount || 0) >= 500 && Number(o.totalAmount || 0) <= 1000).length,
      above1000: orders.filter((o) => Number(o.totalAmount || 0) > 1000).length,
    };

    const tableSpendMap = new Map<string, { tableName: string; totalRevenue: number; ordersCount: number }>();
    orders.forEach((o) => {
      const tName = o.table ? `${o.table.name} (${o.table.code})` : 'Direct / Takeout';
      const existing = tableSpendMap.get(tName);
      if (existing) {
        existing.totalRevenue += Number(o.totalAmount || 0);
        existing.ordersCount += 1;
      } else {
        tableSpendMap.set(tName, {
          tableName: tName,
          totalRevenue: Number(o.totalAmount || 0),
          ordersCount: 1,
        });
      }
    });

    const tableSpendBreakdown = Array.from(tableSpendMap.values())
      .map((t) => ({
        ...t,
        averageSpend: t.ordersCount > 0 ? Math.round((t.totalRevenue / t.ordersCount) * 100) / 100 : 0,
        totalRevenue: Math.round(t.totalRevenue * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const revenueBreakdown = {
      totalGrossRevenue: Math.round(totalRevenue * 100) / 100,
      totalSubtotal: Math.round(totalSubtotal * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      averageTaxPerOrder: Math.round(averageTaxPerOrder * 100) / 100,
      effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
      totalOrders,
      dineInOrdersCount,
      takeoutOrdersCount,
      totalItemsCount,
      averageItemsPerOrder: Math.round(averageItemsPerOrder * 10) / 10,
      highestOrderAmount: Math.round(highestOrderAmount * 100) / 100,
      lowestOrderAmount: Math.round(lowestOrderAmount * 100) / 100,
      ticketDistribution,
      tableSpendBreakdown,
      recentTransactions: orders.slice(-30).reverse().map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.taxAmount || 0),
        discountAmount: Number(o.discountAmount || 0),
        totalAmount: Number(o.totalAmount || 0),
        itemCount: o.items.reduce((iSum, i) => iSum + i.quantity, 0),
        status: o.status,
        tableName: o.table ? `${o.table.name} (${o.table.code})` : 'Direct / Takeout',
        createdAt: o.createdAt.toISOString(),
      })),
    };

    // 2. Sales Trend (group by day)
    const salesTrendMap = new Map<string, { date: string; sales: number; subtotal: number; taxAmount: number; discountAmount: number; orders: number }>();
    
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const currentDay = new Date(start);
    const endMidnight = new Date(end);
    
    while (currentDay <= endMidnight) {
      const dateStr = formatDateStr(currentDay);
      if (!salesTrendMap.has(dateStr)) {
        salesTrendMap.set(dateStr, { date: dateStr, sales: 0, subtotal: 0, taxAmount: 0, discountAmount: 0, orders: 0 });
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }

    orders.forEach((o) => {
      const dateStr = formatDateStr(o.createdAt);
      const existing = salesTrendMap.get(dateStr);
      if (existing) {
        existing.sales += Number(o.totalAmount || 0);
        existing.subtotal += Number(o.subtotal || 0);
        existing.taxAmount += Number(o.taxAmount || 0);
        existing.discountAmount += Number(o.discountAmount || 0);
        existing.orders += 1;
      } else {
        salesTrendMap.set(dateStr, {
          date: dateStr,
          sales: Number(o.totalAmount || 0),
          subtotal: Number(o.subtotal || 0),
          taxAmount: Number(o.taxAmount || 0),
          discountAmount: Number(o.discountAmount || 0),
          orders: 1,
        });
      }
    });

    const salesTrend = Array.from(salesTrendMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 3. Popular Menu Items
    const itemsMap = new Map<string, { name: string; count: number; revenue: number }>();
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = itemsMap.get(item.name);
        if (existing) {
          existing.count += item.quantity;
          existing.revenue += Number(item.totalPrice);
        } else {
          itemsMap.set(item.name, {
            name: item.name,
            count: item.quantity,
            revenue: Number(item.totalPrice),
          });
        }
      });
    });

    const popularItems = Array.from(itemsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Peak Hours (0-23)
    const hoursMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) hoursMap.set(h, 0);

    orders.forEach((o) => {
      const hour = o.createdAt.getHours();
      hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hoursMap.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));

    // 5. Branch Performance
    const branchMap = new Map<string, { branchName: string; sales: number; orders: number }>();
    orders.forEach((o) => {
      const branchName = o.branch?.name ?? 'Main Branch';
      const existing = branchMap.get(branchName);
      if (existing) {
        existing.sales += Number(o.totalAmount);
        existing.orders += 1;
      } else {
        branchMap.set(branchName, {
          branchName,
          sales: Number(o.totalAmount),
          orders: 1,
        });
      }
    });

    const branchPerformance = Array.from(branchMap.values()).sort((a, b) => b.sales - a.sales);

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
      },
      revenueBreakdown,
      salesTrend,
      popularItems,
      peakHours,
      branchPerformance,
    };
  }

  async getPlatformOverview(startDate?: string, endDate?: string) {
    const whereOrder: any = { status: { not: 'CANCELLED' } };
    const whereAllOrders: any = {};

    if (startDate || endDate) {
      const gte = parseStartOfDay(startDate);
      const lte = parseEndOfDay(endDate);
      const dateFilter: any = {};
      if (gte) dateFilter.gte = gte;
      if (lte) dateFilter.lte = lte;
      whereOrder.createdAt = dateFilter;
      whereAllOrders.createdAt = dateFilter;
    }

    const [
      totalTenants,
      totalRestaurants,
      totalUsers,
      totalOrders,
      ordersRevenueSum,
      recentGlobalOrders,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.restaurant.count(),
      this.prisma.user.count(),
      this.prisma.order.count({ where: whereAllOrders }),
      this.prisma.order.aggregate({
        where: whereOrder,
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: whereAllOrders,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          restaurant: { select: { name: true } },
          branch: { select: { name: true } },
        },
      }),
    ]);

    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryHeapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      memoryHeapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      apiLatencyMs: 12,
      systemStatus: 'HEALTHY',
    };

    return {
      metrics: {
        totalTenants,
        totalRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue: ordersRevenueSum._sum.totalAmount ? Number(ordersRevenueSum._sum.totalAmount) : 0,
      },
      systemMetrics,
      recentGlobalOrders: recentGlobalOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        restaurantName: o.restaurant?.name ?? 'Unknown',
        branchName: o.branch?.name ?? 'Unknown',
      })),
    };
  }

}
