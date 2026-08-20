import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ComparisonEngineService } from './comparison-engine.service';
import { PeriodComparisonDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

export interface KpiCard {
  key: string;
  name: string;
  value: number;
  unit: 'INR' | 'PERCENT' | 'COUNT' | 'MINUTES';
  periodLabel: string;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

@Injectable()
export class KpiEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comparisonEngine: ComparisonEngineService,
  ) {}

  /**
   * Computes standardized KPI cards for a restaurant and filter window.
   */
  async computeKpis(
    restaurantId: string,
    filter: PeriodComparisonDto,
  ): Promise<{ kpis: KpiCard[]; metadata: { currentWindow: string; previousWindow: string } }> {
    const { start: currentFrom, end: currentTo } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const { previousFrom, previousTo } = this.comparisonEngine.resolveComparisonWindow(
      currentFrom,
      currentTo,
      filter.comparisonPeriod ?? 'PREVIOUS_PERIOD',
      filter.previousFrom ? new Date(filter.previousFrom) : undefined,
      filter.previousTo ? new Date(filter.previousTo) : undefined,
    );

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.fetchWindowMetrics(restaurantId, currentFrom, currentTo, filter.branchId),
      this.fetchWindowMetrics(restaurantId, previousFrom, previousTo, filter.branchId),
    ]);

    const buildKpi = (
      key: string,
      name: string,
      curr: number,
      prev: number,
      unit: 'INR' | 'PERCENT' | 'COUNT' | 'MINUTES',
    ): KpiCard => {
      const comp = this.comparisonEngine.compare(curr, prev);
      return {
        key,
        name,
        value: comp.currentValue,
        unit,
        periodLabel: `${currentFrom.toISOString().slice(0, 10)} to ${currentTo.toISOString().slice(0, 10)}`,
        previousValue: comp.previousValue,
        change: comp.difference,
        changePercentage: comp.percentageChange,
        trend: comp.trend,
      };
    };

    const kpis: KpiCard[] = [
      buildKpi('gross_revenue', 'Gross Revenue', currentMetrics.grossRevenue, previousMetrics.grossRevenue, 'INR'),
      buildKpi('net_revenue', 'Net Revenue', currentMetrics.netRevenue, previousMetrics.netRevenue, 'INR'),
      buildKpi('total_orders', 'Total Orders', currentMetrics.totalOrders, previousMetrics.totalOrders, 'COUNT'),
      buildKpi('average_order_value', 'Average Order Value (AOV)', currentMetrics.aov, previousMetrics.aov, 'INR'),
      buildKpi('unique_customers', 'Active Customers', currentMetrics.uniqueCustomers, previousMetrics.uniqueCustomers, 'COUNT'),
      buildKpi('repeat_customer_rate', 'Repeat Customer Rate', currentMetrics.repeatCustomerRate, previousMetrics.repeatCustomerRate, 'PERCENT'),
      buildKpi('cancellation_rate', 'Cancellation Rate', currentMetrics.cancellationRate, previousMetrics.cancellationRate, 'PERCENT'),
      buildKpi('refund_rate', 'Refund Rate', currentMetrics.refundRate, previousMetrics.refundRate, 'PERCENT'),
      buildKpi('discount_rate', 'Discount Rate', currentMetrics.discountRate, previousMetrics.discountRate, 'PERCENT'),
    ];

    return {
      kpis,
      metadata: {
        currentWindow: `${currentFrom.toISOString().slice(0, 10)} to ${currentTo.toISOString().slice(0, 10)}`,
        previousWindow: `${previousFrom.toISOString().slice(0, 10)} to ${previousTo.toISOString().slice(0, 10)}`,
      },
    };
  }

  private async fetchWindowMetrics(
    restaurantId: string,
    from: Date,
    to: Date,
    branchId?: string,
  ) {
    const where: any = {
      restaurantId,
      createdAt: { gte: from, lte: to },
    };
    if (branchId) where.branchId = branchId;

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        customerId: true,
        customerSessionId: true,
        refunds: { select: { amount: true, status: true } },
      },
    });

    let grossRevenue = 0;
    let netRevenue = 0;
    let totalOrders = orders.length;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    const customerOrderCounts = new Map<string, number>();

    orders.forEach((o) => {
      grossRevenue += Number(o.totalAmount);
      totalDiscounts += Number(o.discountAmount);

      const custKey = o.customerId || o.customerSessionId || 'anon';
      customerOrderCounts.set(custKey, (customerOrderCounts.get(custKey) || 0) + 1);

      if (o.status === 'CANCELLED') {
        cancelledOrders++;
      } else {
        netRevenue += Number(o.subtotal) - Number(o.discountAmount);
      }

      if (o.status === 'COMPLETED') {
        completedOrders++;
      }

      o.refunds.forEach((r) => {
        if (r.status === 'SUCCESS' || r.status === 'PENDING') {
          totalRefunds += Number(r.amount);
        }
      });
    });

    const aov = completedOrders > 0 ? (grossRevenue - totalRefunds) / completedOrders : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const refundRate = grossRevenue > 0 ? (totalRefunds / grossRevenue) * 100 : 0;
    const discountRate = grossRevenue > 0 ? (totalDiscounts / grossRevenue) * 100 : 0;

    let repeatCustomers = 0;
    customerOrderCounts.forEach((count) => {
      if (count >= 2) repeatCustomers++;
    });
    const uniqueCustomers = customerOrderCounts.size;
    const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    return {
      grossRevenue,
      netRevenue,
      totalOrders,
      completedOrders,
      aov,
      uniqueCustomers,
      repeatCustomerRate,
      cancellationRate,
      refundRate,
      discountRate,
    };
  }
}
