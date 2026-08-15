import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class AiContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderContext(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });

    const statusBreakdown = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders: orders.length,
      statusBreakdown,
    };
  }

  async getSalesContext(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { notIn: ['CANCELLED'] },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        totalAmount: true,
        items: { select: { name: true, quantity: true } },
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

    // Compile items sales count
    const itemMap: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((i) => {
        itemMap[i.name] = (itemMap[i.name] || 0) + i.quantity;
      });
    });

    let topItem = 'None';
    let topItemQty = 0;
    Object.entries(itemMap).forEach(([name, qty]) => {
      if (qty > topItemQty) {
        topItem = name;
        topItemQty = qty;
      }
    });

    return {
      totalSales,
      totalOrders: orders.length,
      averageOrderValue: avgOrderValue,
      topItem,
      topItemQty,
      peakHours: '7 PM - 9 PM',
    };
  }

  async getCustomerContext(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate, lte: endDate },
        customerSessionId: { not: null },
      },
      select: { customerSessionId: true },
    });

    const sessionMap: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.customerSessionId) {
        sessionMap[o.customerSessionId] = (sessionMap[o.customerSessionId] || 0) + 1;
      }
    });

    const totalCustomers = Object.keys(sessionMap).length;
    const repeatCustomers = Object.values(sessionMap).filter((c) => c > 1).length;

    return {
      totalCustomers,
      repeatCustomers,
    };
  }

  async getOperationsContext(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });

    const totalOrders = orders.length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      cancelledOrders,
      cancellationRate,
      peakHours: '7 PM - 9 PM',
    };
  }

  async getInventoryContext(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId },
      select: {
        id: true,
        name: true,
        unitOfMeasure: true,
        currentStock: true,
        minimumReorderLevel: true,
        costPerUnit: true,
      },
    });

    const lowStockItems = ingredients
      .filter((i) => Number(i.currentStock) <= Number(i.minimumReorderLevel) && Number(i.currentStock) > 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: Number(i.currentStock),
        minimumReorderLevel: Number(i.minimumReorderLevel),
        unit: i.unitOfMeasure,
        recommendedReorder: Number(i.minimumReorderLevel) * 2,
      }));

    const outOfStockItems = ingredients
      .filter((i) => Number(i.currentStock) <= 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: 0,
        minimumReorderLevel: Number(i.minimumReorderLevel),
        unit: i.unitOfMeasure,
        recommendedReorder: Number(i.minimumReorderLevel) * 2,
      }));

    const criticalItems = ingredients
      .filter((i) => Number(i.currentStock) <= Number(i.minimumReorderLevel) / 2 && Number(i.currentStock) > 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: Number(i.currentStock),
        minimumReorderLevel: Number(i.minimumReorderLevel),
        unit: i.unitOfMeasure,
        recommendedReorder: Number(i.minimumReorderLevel) * 3,
      }));

    const totalValuation = ingredients.reduce(
      (sum, i) => sum + Number(i.currentStock || 0) * Number(i.costPerUnit || 0),
      0,
    );

    return {
      totalIngredients: ingredients.length,
      totalValuation: Math.round(totalValuation * 100) / 100,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      criticalCount: criticalItems.length,
      lowStockItems,
      outOfStockItems,
      criticalItems,
    };
  }
}
