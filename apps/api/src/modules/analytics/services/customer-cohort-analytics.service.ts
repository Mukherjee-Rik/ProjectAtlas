import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface CohortRow {
  cohortMonth: string; // 'YYYY-MM'
  newCustomersCount: number;
  retentionPercentages: number[]; // [100, 72, 54, 41, ...] for Month 0, Month 1, Month 2...
}

@Injectable()
export class CustomerCohortAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerAndCohortAnalytics(restaurantId: string) {
    const [customers, allOrders] = await Promise.all([
      this.prisma.customer.findMany({
        where: { restaurantId },
        select: {
          id: true,
          name: true,
          phone: true,
          segment: true,
          totalOrders: true,
          totalSpend: true,
          averageOrderValue: true,
          firstOrderAt: true,
          lastOrderAt: true,
          cohortMonth: true,
        },
      }),
      this.prisma.order.findMany({
        where: {
          restaurantId,
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          customerId: true,
          customerSessionId: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // 1. Customer Segmentation Summary
    const segmentMap: Record<string, { count: number; totalSpend: number }> = {
      NEW: { count: 0, totalSpend: 0 },
      RETURNING: { count: 0, totalSpend: 0 },
      FREQUENT: { count: 0, totalSpend: 0 },
      HIGH_VALUE: { count: 0, totalSpend: 0 },
      AT_RISK: { count: 0, totalSpend: 0 },
      INACTIVE: { count: 0, totalSpend: 0 },
    };

    const totalTrackedCustomers = customers.length;
    let totalLifetimeRevenue = 0;

    customers.forEach((c) => {
      const seg = c.segment || 'NEW';
      const spend = Number(c.totalSpend);
      totalLifetimeRevenue += spend;

      if (!segmentMap[seg]) segmentMap[seg] = { count: 0, totalSpend: 0 };
      segmentMap[seg].count += 1;
      segmentMap[seg].totalSpend += spend;
    });

    const averageLtv =
      totalTrackedCustomers > 0
        ? totalLifetimeRevenue / totalTrackedCustomers
        : 0;

    // 2. Cohort Retention Computation
    // Map each customer/session to their first order month and their subsequent active months
    const customerFirstMonth = new Map<string, string>();
    const customerActiveMonths = new Map<string, Set<string>>();

    allOrders.forEach((o) => {
      const custId = o.customerId || o.customerSessionId;
      if (!custId) return;

      const orderMonth = o.createdAt.toISOString().slice(0, 7); // 'YYYY-MM'

      if (!customerFirstMonth.has(custId)) {
        customerFirstMonth.set(custId, orderMonth);
      }

      if (!customerActiveMonths.has(custId)) {
        customerActiveMonths.set(custId, new Set<string>());
      }
      customerActiveMonths.get(custId)!.add(orderMonth);
    });

    // Group cohorts
    const cohortGroups = new Map<string, Set<string>>();
    customerFirstMonth.forEach((cohortMonth, custId) => {
      if (!cohortGroups.has(cohortMonth)) {
        cohortGroups.set(cohortMonth, new Set<string>());
      }
      cohortGroups.get(cohortMonth)!.add(custId);
    });

    const sortedCohorts = Array.from(cohortGroups.keys()).sort();

    // Helper: calculate month offset (Month 0, Month 1, Month 2...)
    const getMonthOffset = (
      startMonthStr: string,
      targetMonthStr: string,
    ): number => {
      const [sy, sm] = startMonthStr.split('-').map(Number);
      const [ty, tm] = targetMonthStr.split('-').map(Number);
      return (ty - sy) * 12 + (tm - sm);
    };

    const cohortTable: CohortRow[] = sortedCohorts.map((cohortMonth) => {
      const cohortCustomers = cohortGroups.get(cohortMonth)!;
      const initialSize = cohortCustomers.size;

      // Track active counts per month offset (0..5)
      const monthlyActiveCounts = new Array(6).fill(0);

      cohortCustomers.forEach((custId) => {
        const activeMonths = customerActiveMonths.get(custId);
        if (activeMonths) {
          activeMonths.forEach((m) => {
            const offset = getMonthOffset(cohortMonth, m);
            if (offset >= 0 && offset < 6) {
              monthlyActiveCounts[offset] += 1;
            }
          });
        }
      });

      const retentionPercentages = monthlyActiveCounts.map((count) =>
        initialSize > 0 ? Math.round((count / initialSize) * 1000) / 10 : 0,
      );

      return {
        cohortMonth,
        newCustomersCount: initialSize,
        retentionPercentages,
      };
    });

    return {
      summary: {
        totalCustomers: totalTrackedCustomers || customerFirstMonth.size,
        averageLifetimeValue: Math.round(averageLtv * 100) / 100,
        repeatRate:
          totalTrackedCustomers > 0
            ? Math.round(
                (customers.filter((c) => c.totalOrders >= 2).length /
                  totalTrackedCustomers) *
                  10000,
              ) / 100
            : 0,
      },
      segmentation: Object.entries(segmentMap).map(([segment, data]) => ({
        segment,
        customersCount: data.count,
        revenue: Math.round(data.totalSpend * 100) / 100,
      })),
      cohortRetentionMatrix: cohortTable.reverse().slice(0, 12),
    };
  }
}
