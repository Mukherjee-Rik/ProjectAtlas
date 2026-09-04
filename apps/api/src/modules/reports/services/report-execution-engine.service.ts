import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ReportValidatorService } from './report-validator.service';
import { ReportConfigurationDto } from '../dto/custom-report.dto';
import {
  APPROVED_METRICS,
  APPROVED_DIMENSIONS,
} from '../constants/metric-registry.constants';

export interface ReportExecutionResult {
  reportName: string;
  dataSource: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  visualization: {
    type: string;
    title?: string;
  };
  columns: Array<{ key: string; label: string; unit?: string }>;
  rows: Array<Record<string, any>>;
  summary: Record<string, any>;
}

@Injectable()
export class ReportExecutionEngineService {
  private readonly logger = new Logger(ReportExecutionEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ReportValidatorService,
  ) {}

  /**
   * Resolves relative date preset strings into concrete Start and End Date objects.
   */
  resolveDateRange(dateRange: ReportConfigurationDto['dateRange']): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    const preset = dateRange.preset || 'THIS_MONTH';

    if (preset === 'CUSTOM' && dateRange.customFrom && dateRange.customTo) {
      return {
        start: new Date(dateRange.customFrom),
        end: new Date(dateRange.customTo),
      };
    }

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    switch (preset) {
      case 'TODAY':
        return { start: todayStart, end: todayEnd };

      case 'YESTERDAY': {
        const yStart = new Date(todayStart);
        yStart.setDate(yStart.getDate() - 1);
        const yEnd = new Date(todayEnd);
        yEnd.setDate(yEnd.getDate() - 1);
        return { start: yStart, end: yEnd };
      }

      case 'THIS_WEEK': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const wStart = new Date(now.setDate(diff));
        wStart.setHours(0, 0, 0, 0);
        return { start: wStart, end: todayEnd };
      }

      case 'LAST_WEEK': {
        const day = now.getDay();
        const diff = now.getDate() - day - 6;
        const lwStart = new Date(now.setDate(diff));
        lwStart.setHours(0, 0, 0, 0);
        const lwEnd = new Date(lwStart);
        lwEnd.setDate(lwEnd.getDate() + 6);
        lwEnd.setHours(23, 59, 59, 999);
        return { start: lwStart, end: lwEnd };
      }

      case 'LAST_MONTH': {
        const lmStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
          0,
          0,
          0,
          0,
        );
        const lmEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        return { start: lmStart, end: lmEnd };
      }

      case 'THIS_YEAR': {
        const tyStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return { start: tyStart, end: todayEnd };
      }

      case 'LAST_30_DAYS':
      default: {
        // Default: THIS_MONTH
        const mStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        return { start: mStart, end: todayEnd };
      }
    }
  }

  /**
   * Executes a custom report configuration against the database layer.
   */
  async execute(
    restaurantId: string,
    reportName: string,
    dataSource: string,
    config: ReportConfigurationDto,
    scopedBranchId?: string,
  ): Promise<ReportExecutionResult> {
    this.validator.validate(dataSource, config);

    const { start, end } = this.resolveDateRange(config.dateRange);
    const primaryDimension = config.dimensions[0] || 'DATE_DAY';

    let rows: Array<Record<string, any>> = [];
    const summary: Record<string, any> = {};

    switch (dataSource) {
      case 'SALES': {
        const where: any = {
          restaurantId,
          createdAt: { gte: start, lte: end },
        };
        if (scopedBranchId) where.branchId = scopedBranchId;

        const orders = await this.prisma.order.findMany({
          where,
          include: {
            branch: { select: { name: true } },
            refunds: { select: { amount: true, status: true } },
          },
          orderBy: { createdAt: 'asc' },
        });

        const groupMap = new Map<
          string,
          {
            label: string;
            gross: number;
            net: number;
            tax: number;
            disc: number;
            refund: number;
            cancel: number;
            totalOrders: number;
            completedOrders: number;
          }
        >();

        let totGross = 0;
        let totNet = 0;
        const totOrders = orders.length;

        orders.forEach((o) => {
          let groupKey = o.createdAt.toISOString().slice(0, 10);
          let groupLabel = groupKey;

          if (primaryDimension === 'DATE_HOUR') {
            const h = o.createdAt.getHours();
            groupKey = `${h}:00`;
            groupLabel = `${h}:00`;
          } else if (primaryDimension === 'BRANCH') {
            groupKey = o.branchId;
            groupLabel = o.branch?.name || 'Branch';
          }

          const existing = groupMap.get(groupKey) || {
            label: groupLabel,
            gross: 0,
            net: 0,
            tax: 0,
            disc: 0,
            refund: 0,
            cancel: 0,
            totalOrders: 0,
            completedOrders: 0,
          };

          const tot = Number(o.totalAmount);
          const sub = Number(o.subtotal);
          const disc = Number(o.discountAmount);
          const tax = Number(o.taxAmount);

          existing.gross += tot;
          existing.tax += tax;
          existing.disc += disc;
          existing.totalOrders += 1;
          totGross += tot;

          if (o.status === 'CANCELLED') {
            existing.cancel += tot;
          } else {
            const net = sub - disc;
            existing.net += net;
            totNet += net;
          }

          if (o.status === 'COMPLETED') {
            existing.completedOrders += 1;
          }

          o.refunds.forEach((r) => {
            if (r.status === 'SUCCESS' || r.status === 'PENDING') {
              existing.refund += Number(r.amount);
            }
          });

          groupMap.set(groupKey, existing);
        });

        rows = Array.from(groupMap.entries()).map(([k, v]) => ({
          dimensionKey: k,
          dimensionLabel: v.label,
          GROSS_SALES: Math.round(v.gross * 100) / 100,
          NET_SALES: Math.round(v.net * 100) / 100,
          TAX_AMOUNT: Math.round(v.tax * 100) / 100,
          DISCOUNT_AMOUNT: Math.round(v.disc * 100) / 100,
          REFUND_AMOUNT: Math.round(v.refund * 100) / 100,
          CANCELLED_AMOUNT: Math.round(v.cancel * 100) / 100,
          AVERAGE_ORDER_VALUE:
            v.completedOrders > 0
              ? Math.round(((v.gross - v.refund) / v.completedOrders) * 100) /
                100
              : 0,
          TOTAL_ORDERS: v.totalOrders,
        }));

        summary.totalGrossSales = Math.round(totGross * 100) / 100;
        summary.totalNetSales = Math.round(totNet * 100) / 100;
        summary.totalOrders = totOrders;
        break;
      }

      case 'MENU': {
        const orderItems = await this.prisma.orderItem.findMany({
          where: {
            order: {
              restaurantId,
              status: { not: 'CANCELLED' },
              createdAt: { gte: start, lte: end },
              ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
            },
          },
          include: {
            menuItem: {
              include: { category: { select: { name: true } } },
            },
          },
        });

        const itemMap = new Map<
          string,
          {
            label: string;
            category: string;
            units: number;
            revenue: number;
            orders: Set<string>;
          }
        >();
        let grandMenuRevenue = 0;

        orderItems.forEach((oi) => {
          const key =
            primaryDimension === 'MENU_CATEGORY'
              ? oi.menuItem?.category?.name || 'General'
              : oi.menuItemId;
          const label =
            primaryDimension === 'MENU_CATEGORY'
              ? key
              : oi.menuItem?.name || oi.name;

          const existing = itemMap.get(key) || {
            label,
            category: oi.menuItem?.category?.name || 'General',
            units: 0,
            revenue: 0,
            orders: new Set<string>(),
          };

          const rev = Number(oi.totalPrice);
          existing.units += oi.quantity;
          existing.revenue += rev;
          existing.orders.add(oi.orderId);
          grandMenuRevenue += rev;

          itemMap.set(key, existing);
        });

        rows = Array.from(itemMap.entries()).map(([k, v]) => ({
          dimensionKey: k,
          dimensionLabel: v.label,
          UNITS_SOLD: v.units,
          GROSS_REVENUE: Math.round(v.revenue * 100) / 100,
          REVENUE_SHARE_PERCENT:
            grandMenuRevenue > 0
              ? Math.round((v.revenue / grandMenuRevenue) * 10000) / 100
              : 0,
          ORDERS_CONTAINING_ITEM: v.orders.size,
        }));

        summary.totalMenuRevenue = Math.round(grandMenuRevenue * 100) / 100;
        summary.totalUnitsSold = rows.reduce(
          (s, r) => s + (r.UNITS_SOLD || 0),
          0,
        );
        break;
      }

      case 'CUSTOMERS': {
        const customers = await this.prisma.customer.findMany({
          where: { restaurantId },
        });

        const segMap = new Map<string, { count: number; spend: number }>();
        customers.forEach((c) => {
          const seg = c.segment || 'NEW';
          const existing = segMap.get(seg) || { count: 0, spend: 0 };
          existing.count += 1;
          existing.spend += Number(c.totalSpend);
          segMap.set(seg, existing);
        });

        rows = Array.from(segMap.entries()).map(([seg, data]) => ({
          dimensionKey: seg,
          dimensionLabel: seg,
          TOTAL_CUSTOMERS: data.count,
          LIFETIME_VALUE:
            data.count > 0
              ? Math.round((data.spend / data.count) * 100) / 100
              : 0,
          REPEAT_RATE:
            customers.length > 0
              ? Math.round(
                  (customers.filter((c) => c.totalOrders >= 2).length /
                    customers.length) *
                    10000,
                ) / 100
              : 0,
        }));

        summary.totalCustomers = customers.length;
        break;
      }

      default: {
        // Generic fallback query using DailySalesAggregate
        const aggregates = await this.prisma.dailySalesAggregate.findMany({
          where: {
            restaurantId,
            date: { gte: start, lte: end },
            ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
          },
          include: { branch: { select: { name: true } } },
        });

        rows = aggregates.map((a) => ({
          dimensionKey: a.date.toISOString().slice(0, 10),
          dimensionLabel:
            primaryDimension === 'BRANCH'
              ? a.branch.name
              : a.date.toISOString().slice(0, 10),
          GROSS_SALES: Number(a.grossSales),
          NET_SALES: Number(a.netSales),
          TOTAL_ORDERS: a.totalOrders,
          AVERAGE_ORDER_VALUE: Number(a.averageOrderValue),
        }));
        break;
      }
    }

    // Apply Sorting
    if (config.sorting && config.sorting.length > 0) {
      const sort = config.sorting[0];
      rows.sort((a, b) => {
        const valA = a[sort.field] ?? a.dimensionLabel;
        const valB = b[sort.field] ?? b.dimensionLabel;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sort.direction === 'DESC' ? valB - valA : valA - valB;
        }
        return sort.direction === 'DESC'
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });
    }

    // Apply Limit
    if (config.limit && config.limit > 0) {
      rows = rows.slice(0, config.limit);
    }

    // Build Column Metadata
    const columns: ReportExecutionResult['columns'] = [
      {
        key: 'dimensionLabel',
        label:
          APPROVED_DIMENSIONS[
            primaryDimension as keyof typeof APPROVED_DIMENSIONS
          ]?.name || 'Group',
      },
      ...config.metrics.map((mKey) => ({
        key: mKey,
        label: APPROVED_METRICS[mKey]?.name || mKey,
        unit: APPROVED_METRICS[mKey]?.unit,
      })),
    ];

    return {
      reportName,
      dataSource,
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        preset: config.dateRange.preset,
      },
      visualization: config.visualization,
      columns,
      rows,
      summary,
    };
  }
}
