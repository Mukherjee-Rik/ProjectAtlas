import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

@Injectable()
export class RevenueAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueBreakdown(restaurantId: string, filter: AnalyticsFilterDto) {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const where: any = {
      restaurantId,
      createdAt: { gte: start, lte: end },
    };
    if (filter.branchId) where.branchId = filter.branchId;

    const [orders, payments, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          source: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          totalAmount: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          restaurantId,
          createdAt: { gte: start, lte: end },
        },
        select: {
          method: true,
          status: true,
          amount: true,
        },
      }),
      this.prisma.refund.findMany({
        where: {
          restaurantId,
          createdAt: { gte: start, lte: end },
        },
        select: {
          amount: true,
          status: true,
          reason: true,
        },
      }),
    ]);

    let grossRevenue = 0;
    let netRevenue = 0;
    let totalTaxes = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let cancelledRevenue = 0;

    const sourceBreakdown: Record<string, { count: number; volume: number }> =
      {};
    const branchBreakdown: Record<
      string,
      { branchId: string; name: string; volume: number; orders: number }
    > = {};

    orders.forEach((o) => {
      const isCancelled = o.status === 'CANCELLED';
      const tot = Number(o.totalAmount);
      const sub = Number(o.subtotal);
      const disc = Number(o.discountAmount);
      const tax = Number(o.taxAmount);

      grossRevenue += tot;
      totalTaxes += tax;
      totalDiscounts += disc;

      if (isCancelled) {
        cancelledRevenue += tot;
      } else {
        netRevenue += sub - disc;
      }

      // Source distribution
      const src = o.source || 'DIRECT';
      if (!sourceBreakdown[src]) sourceBreakdown[src] = { count: 0, volume: 0 };
      sourceBreakdown[src].count += 1;
      sourceBreakdown[src].volume += tot;

      // Branch distribution
      const bId = o.branch.id;
      if (!branchBreakdown[bId]) {
        branchBreakdown[bId] = {
          branchId: bId,
          name: o.branch.name,
          volume: 0,
          orders: 0,
        };
      }
      branchBreakdown[bId].volume += tot;
      branchBreakdown[bId].orders += 1;
    });

    refunds.forEach((r) => {
      if (r.status === 'SUCCESS' || r.status === 'PENDING') {
        totalRefunds += Number(r.amount);
      }
    });

    // Payment methods breakdown
    const paymentMethodsMap: Record<string, { count: number; volume: number }> =
      {};
    payments.forEach((p) => {
      if (p.status === 'SUCCESS') {
        const m = p.method || 'CASH';
        if (!paymentMethodsMap[m])
          paymentMethodsMap[m] = { count: 0, volume: 0 };
        paymentMethodsMap[m].count += 1;
        paymentMethodsMap[m].volume += Number(p.amount);
      }
    });

    return {
      financialSummary: {
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        settledRevenue: Math.round((grossRevenue - totalRefunds) * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        cancelledRevenue: Math.round(cancelledRevenue * 100) / 100,
      },
      channelDistribution: Object.entries(sourceBreakdown).map(
        ([source, data]) => ({
          channel: source,
          ordersCount: data.count,
          revenue: Math.round(data.volume * 100) / 100,
          sharePercentage:
            grossRevenue > 0
              ? Math.round((data.volume / grossRevenue) * 10000) / 100
              : 0,
        }),
      ),
      paymentMethodDistribution: Object.entries(paymentMethodsMap).map(
        ([method, data]) => ({
          method,
          transactionsCount: data.count,
          volume: Math.round(data.volume * 100) / 100,
        }),
      ),
      branchRevenueSummary: Object.values(branchBreakdown).map((b) => ({
        ...b,
        volume: Math.round(b.volume * 100) / 100,
        averageOrderValue:
          b.orders > 0 ? Math.round((b.volume / b.orders) * 100) / 100 : 0,
      })),
    };
  }
}
