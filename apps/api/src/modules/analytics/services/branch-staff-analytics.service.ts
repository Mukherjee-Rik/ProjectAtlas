import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

@Injectable()
export class BranchStaffAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranchComparison(restaurantId: string, filter: AnalyticsFilterDto) {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const [branches, orders] = await Promise.all([
      this.prisma.branch.findMany({
        where: { restaurantId, status: 'ACTIVE' },
        select: { id: true, name: true, code: true, city: true },
      }),
      this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          branchId: true,
          status: true,
          totalAmount: true,
          subtotal: true,
          discountAmount: true,
          createdAt: true,
        },
      }),
    ]);

    const branchStats = new Map<
      string,
      {
        branchId: string;
        name: string;
        code: string;
        city: string;
        grossRevenue: number;
        netRevenue: number;
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
      }
    >();

    branches.forEach((b) => {
      branchStats.set(b.id, {
        branchId: b.id,
        name: b.name,
        code: b.code,
        city: b.city || 'Primary',
        grossRevenue: 0,
        netRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      });
    });

    let totalNetworkRevenue = 0;

    orders.forEach((o) => {
      const stats = branchStats.get(o.branchId);
      if (!stats) return;

      const tot = Number(o.totalAmount);
      stats.grossRevenue += tot;
      stats.totalOrders += 1;
      totalNetworkRevenue += tot;

      if (o.status === 'COMPLETED') {
        stats.completedOrders += 1;
      }
      if (o.status === 'CANCELLED') {
        stats.cancelledOrders += 1;
      } else {
        stats.netRevenue += Number(o.subtotal) - Number(o.discountAmount);
      }
    });

    const branchComparisons = Array.from(branchStats.values()).map((b) => {
      const aov = b.completedOrders > 0 ? b.grossRevenue / b.completedOrders : 0;
      const cancellationRate = b.totalOrders > 0 ? (b.cancelledOrders / b.totalOrders) * 100 : 0;
      const networkShare = totalNetworkRevenue > 0 ? (b.grossRevenue / totalNetworkRevenue) * 100 : 0;

      return {
        ...b,
        grossRevenue: Math.round(b.grossRevenue * 100) / 100,
        netRevenue: Math.round(b.netRevenue * 100) / 100,
        averageOrderValue: Math.round(aov * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        networkContributionPercent: Math.round(networkShare * 100) / 100,
      };
    });

    return {
      totalBranches: branches.length,
      totalNetworkRevenue: Math.round(totalNetworkRevenue * 100) / 100,
      branches: branchComparisons.sort((a, b) => b.grossRevenue - a.grossRevenue),
    };
  }

  async getStaffOperationalAnalytics(restaurantId: string, filter: AnalyticsFilterDto) {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const whereEvents: any = {
      restaurantId,
      timestamp: { gte: start, lte: end },
      actorUserId: { not: null },
    };
    if (filter.branchId) whereEvents.branchId = filter.branchId;

    const events = await this.prisma.operationalEvent.findMany({
      where: whereEvents,
      select: {
        actorUserId: true,
        eventType: true,
        entityType: true,
        timestamp: true,
      },
    });

    const userActivity = new Map<
      string,
      { ordersHandled: number; completions: number; cancellations: number; totalActions: number }
    >();

    events.forEach((ev) => {
      if (!ev.actorUserId) return;
      const existing = userActivity.get(ev.actorUserId) || {
        ordersHandled: 0,
        completions: 0,
        cancellations: 0,
        totalActions: 0,
      };

      existing.totalActions += 1;
      if (ev.eventType.includes('ORDER')) existing.ordersHandled += 1;
      if (ev.eventType === 'ORDER_COMPLETED') existing.completions += 1;
      if (ev.eventType === 'ORDER_CANCELLED') existing.cancellations += 1;

      userActivity.set(ev.actorUserId, existing);
    });

    const userIds = Array.from(userActivity.keys());
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const staffMetrics = Array.from(userActivity.entries()).map(([userId, stats]) => {
      const u = userMap.get(userId);
      return {
        userId,
        name: u?.name || 'Staff Member',
        email: u?.email || 'N/A',
        role: u?.role || 'STAFF',
        ordersHandled: stats.ordersHandled,
        completions: stats.completions,
        cancellations: stats.cancellations,
        totalActions: stats.totalActions,
      };
    });

    return {
      activeStaffCount: staffMetrics.length,
      staff: staffMetrics.sort((a, b) => b.totalActions - a.totalActions),
    };
  }
}
