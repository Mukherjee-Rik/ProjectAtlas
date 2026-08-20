import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface AiGatewayContext {
  tenantId: string;
  restaurantId: string;
  branchId?: string;
  actorUserId?: string;
  userRole?: string;
}

export interface AiGatewayQueryResult {
  queryType: string;
  restaurantId: string;
  branchId?: string;
  timestamp: string;
  executionTimeMs: number;
  data: Record<string, any>;
}

@Injectable()
export class AiDataGatewayService {
  private readonly logger = new Logger(AiDataGatewayService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a controlled, tenant-isolated data request for AI reasoning.
   */
  async executeQuery(
    context: AiGatewayContext,
    queryType: string,
    parameters?: Record<string, any>,
  ): Promise<AiGatewayQueryResult> {
    const startTime = Date.now();

    if (!context.restaurantId) {
      throw new BadRequestException('Restaurant context is strictly required for AI data gateway access');
    }

    let queryResultData: Record<string, any> = {};

    switch (queryType) {
      case 'REVENUE_SUMMARY': {
        const startDate = parameters?.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 30 * 86400000);
        const endDate = parameters?.endDate ? new Date(parameters.endDate) : new Date();

        const aggregates = await this.prisma.dailySalesAggregate.findMany({
          where: {
            restaurantId: context.restaurantId,
            ...(context.branchId ? { branchId: context.branchId } : {}),
            date: { gte: startDate, lte: endDate },
          },
          orderBy: { date: 'asc' },
        });

        const totalGross = aggregates.reduce((sum, a) => sum + Number(a.grossSales), 0);
        const totalNet = aggregates.reduce((sum, a) => sum + Number(a.netSales), 0);
        const totalOrders = aggregates.reduce((sum, a) => sum + a.totalOrders, 0);

        queryResultData = {
          periodDays: aggregates.length,
          totalGrossSales: totalGross,
          totalNetSales: totalNet,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalGross / totalOrders : 0,
        };
        break;
      }

      case 'MENU_PERFORMANCE': {
        const topItems = await this.prisma.menuItemDailyMetrics.groupBy({
          by: ['menuItemId'],
          where: {
            restaurantId: context.restaurantId,
            ...(context.branchId ? { branchId: context.branchId } : {}),
          },
          _sum: { quantitySold: true, grossRevenue: true },
          orderBy: { _sum: { grossRevenue: 'desc' } },
          take: parameters?.limit ?? 10,
        });

        const itemIds = topItems.map((i) => i.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, name: true, price: true, dietaryType: true },
        });

        const itemMap = new Map(menuItems.map((m) => [m.id, m]));

        queryResultData = {
          topPerformers: topItems.map((item) => ({
            menuItemId: item.menuItemId,
            name: itemMap.get(item.menuItemId)?.name ?? 'Unknown',
            dietaryType: itemMap.get(item.menuItemId)?.dietaryType ?? 'VEG',
            quantitySold: item._sum.quantitySold ?? 0,
            grossRevenue: Number(item._sum.grossRevenue ?? 0),
          })),
        };
        break;
      }

      case 'CUSTOMER_SEGMENTS': {
        const segmentCounts = await this.prisma.customer.groupBy({
          by: ['segment'],
          where: { restaurantId: context.restaurantId },
          _count: { _all: true },
          _sum: { totalSpend: true },
        });

        queryResultData = {
          segments: segmentCounts.map((s) => ({
            segment: s.segment,
            count: s._count._all,
            totalSpend: Number(s._sum.totalSpend ?? 0),
          })),
        };
        break;
      }

      default:
        throw new BadRequestException(`Unsupported AI Gateway queryType "${queryType}"`);
    }

    const executionTimeMs = Date.now() - startTime;

    // Write audit record asynchronously
    void this.prisma.intelligenceQueryAudit
      .create({
        data: {
          tenantId: context.tenantId,
          restaurantId: context.restaurantId,
          branchId: context.branchId,
          actorUserId: context.actorUserId,
          serviceName: 'AiDataGatewayService',
          queryType,
          queryParameters: parameters ?? {},
          executionTimeMs,
        },
      })
      .catch((e) => this.logger.error(`Failed to audit query: ${e?.message}`));

    return {
      queryType,
      restaurantId: context.restaurantId,
      branchId: context.branchId,
      timestamp: new Date().toISOString(),
      executionTimeMs,
      data: queryResultData,
    };
  }
}
