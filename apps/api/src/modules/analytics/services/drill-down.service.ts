import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { DrillDownQueryDto } from '../dto/analytics-filter.dto';
import { parseDateBounds } from '../utils/date-range.util';

@Injectable()
export class DrillDownService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Drills down from an aggregate metric to underlying dimensions or raw order transactions.
   */
  async drillDown(restaurantId: string, query: DrillDownQueryDto) {
    const { start, end } = parseDateBounds(query.dateFrom, query.dateTo, 30);

    const whereOrder: any = {
      restaurantId,
      createdAt: { gte: start, lte: end },
    };

    if (query.branchId) whereOrder.branchId = query.branchId;

    switch (query.dimension) {
      case 'BRANCH': {
        const branches = await this.prisma.branch.findMany({
          where: { restaurantId, status: 'ACTIVE' },
          include: {
            orders: {
              where: { createdAt: { gte: start, lte: end } },
              select: { totalAmount: true, status: true },
            },
          },
        });

        return {
          dimension: 'BRANCH',
          results: branches.map((b) => {
            const rev = b.orders.reduce(
              (sum, o) => sum + Number(o.totalAmount),
              0,
            );
            return {
              id: b.id,
              name: b.name,
              code: b.code,
              ordersCount: b.orders.length,
              grossRevenue: Math.round(rev * 100) / 100,
            };
          }),
        };
      }

      case 'CATEGORY': {
        const categories = await this.prisma.menuCategory.findMany({
          where: { menu: { restaurantId } },
          include: {
            items: {
              include: {
                orderItems: {
                  where: { order: whereOrder },
                  select: { totalPrice: true, quantity: true },
                },
              },
            },
          },
        });

        return {
          dimension: 'CATEGORY',
          results: categories.map((c) => {
            let totalRevenue = 0;
            let totalUnits = 0;
            c.items.forEach((item) => {
              item.orderItems.forEach((oi) => {
                totalRevenue += Number(oi.totalPrice);
                totalUnits += oi.quantity;
              });
            });
            return {
              id: c.id,
              name: c.name,
              menuItemsCount: c.items.length,
              unitsSold: totalUnits,
              grossRevenue: Math.round(totalRevenue * 100) / 100,
            };
          }),
        };
      }

      case 'MENU_ITEM': {
        const whereItemOrder = { ...whereOrder };
        if (query.categoryId) {
          whereItemOrder.items = {
            some: { menuItem: { categoryId: query.categoryId } },
          };
        }

        const items = await this.prisma.menuItem.findMany({
          where: {
            category: {
              menu: { restaurantId },
              ...(query.categoryId ? { id: query.categoryId } : {}),
            },
          },
          include: {
            category: { select: { name: true } },
            orderItems: {
              where: { order: whereOrder },
              select: { totalPrice: true, quantity: true },
            },
          },
        });

        return {
          dimension: 'MENU_ITEM',
          results: items.map((i) => {
            const revenue = i.orderItems.reduce(
              (sum, oi) => sum + Number(oi.totalPrice),
              0,
            );
            const units = i.orderItems.reduce(
              (sum, oi) => sum + oi.quantity,
              0,
            );
            return {
              id: i.id,
              name: i.name,
              categoryName: i.category?.name || 'General',
              price: Number(i.price),
              unitsSold: units,
              grossRevenue: Math.round(revenue * 100) / 100,
            };
          }),
        };
      }

      case 'ORDER': {
        const specificWhere = { ...whereOrder };
        if (query.targetId) {
          // Can be menuItemId, categoryId, or branchId
          specificWhere.OR = [
            { branchId: query.targetId },
            { items: { some: { menuItemId: query.targetId } } },
          ];
        }

        const orders = await this.prisma.order.findMany({
          where: specificWhere,
          include: {
            branch: { select: { name: true } },
            table: { select: { name: true, code: true } },
            items: {
              select: {
                name: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        return {
          dimension: 'ORDER',
          ordersCount: orders.length,
          transactions: orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            source: o.source,
            subtotal: Number(o.subtotal),
            discountAmount: Number(o.discountAmount),
            taxAmount: Number(o.taxAmount),
            totalAmount: Number(o.totalAmount),
            tableName: o.table
              ? `${o.table.name} (${o.table.code})`
              : 'Direct / Takeout',
            branchName: o.branch?.name || 'Branch',
            createdAt: o.createdAt.toISOString(),
            itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
            items: o.items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
            })),
          })),
        };
      }

      default:
        throw new BadRequestException(
          `Unsupported drill-down dimension: ${query.dimension}`,
        );
    }
  }
}
