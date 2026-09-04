import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

@Injectable()
export class AnalyticsExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a sanitized CSV string for orders and financial performance.
   */
  async exportOrdersCsv(
    restaurantId: string,
    filter: AnalyticsFilterDto,
  ): Promise<string> {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const where: any = {
      restaurantId,
      createdAt: { gte: start, lte: end },
    };
    if (filter.branchId) where.branchId = filter.branchId;

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        table: { select: { name: true, code: true } },
        items: { select: { name: true, quantity: true, totalPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const headers = [
      'Order Number',
      'Date & Time',
      'Branch',
      'Table',
      'Status',
      'Source',
      'Subtotal',
      'Discount',
      'Tax',
      'Total Amount',
      'Items Count',
    ];

    const escapeCsv = (val: any) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = orders.map((o) => [
      escapeCsv(o.orderNumber),
      escapeCsv(o.createdAt.toISOString()),
      escapeCsv(o.branch?.name || 'Main Branch'),
      escapeCsv(
        o.table ? `${o.table.name} (${o.table.code})` : 'Takeout/Direct',
      ),
      escapeCsv(o.status),
      escapeCsv(o.source),
      escapeCsv(Number(o.subtotal).toFixed(2)),
      escapeCsv(Number(o.discountAmount).toFixed(2)),
      escapeCsv(Number(o.taxAmount).toFixed(2)),
      escapeCsv(Number(o.totalAmount).toFixed(2)),
      escapeCsv(o.items.reduce((s, i) => s + i.quantity, 0)),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates a sanitized CSV string for menu performance.
   */
  async exportMenuCsv(
    restaurantId: string,
    filter: AnalyticsFilterDto,
  ): Promise<string> {
    const { start, end } = parseDateBounds(filter.dateFrom, filter.dateTo, 30);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: start, lte: end },
          ...(filter.branchId ? { branchId: filter.branchId } : {}),
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
        name: string;
        category: string;
        price: number;
        unitsSold: number;
        totalRevenue: number;
      }
    >();

    orderItems.forEach((oi) => {
      const existing = itemMap.get(oi.menuItemId) || {
        name: oi.menuItem?.name || oi.name,
        category: oi.menuItem?.category?.name || 'General',
        price: Number(oi.unitPrice),
        unitsSold: 0,
        totalRevenue: 0,
      };

      existing.unitsSold += oi.quantity;
      existing.totalRevenue += Number(oi.totalPrice);
      itemMap.set(oi.menuItemId, existing);
    });

    const headers = [
      'Menu Item Name',
      'Category',
      'Unit Price',
      'Units Sold',
      'Total Revenue',
    ];
    const escapeCsv = (val: any) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = Array.from(itemMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((item) => [
        escapeCsv(item.name),
        escapeCsv(item.category),
        escapeCsv(item.price.toFixed(2)),
        escapeCsv(item.unitsSold),
        escapeCsv(item.totalRevenue.toFixed(2)),
      ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
