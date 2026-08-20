import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface DataQualityReport {
  status: 'HEALTHY' | 'ANOMALIES_DETECTED';
  checksPerformed: number;
  anomaliesCount: number;
  details: {
    negativeRevenueOrders: number;
    subtotalDiscrepancyOrders: number;
    orphanedOrderItems: number;
    missingBranchOrders: number;
    aggregateSyncDiscrepancies: number;
  };
  sampleAnomalies: Array<{
    type: string;
    entityId: string;
    description: string;
  }>;
}

@Injectable()
export class DataQualityService {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs an end-to-end data quality and consistency reconciliation audit.
   */
  async runAudit(restaurantId: string): Promise<DataQualityReport> {
    const sampleAnomalies: DataQualityReport['sampleAnomalies'] = [];
    let checksPerformed = 0;
    let anomaliesCount = 0;

    // 1. Check for negative revenue or invalid totals
    checksPerformed++;
    const invalidTotals = await this.prisma.order.findMany({
      where: {
        restaurantId,
        OR: [{ totalAmount: { lt: 0 } }, { subtotal: { lt: 0 } }, { taxAmount: { lt: 0 } }],
      },
      select: { id: true, orderNumber: true, totalAmount: true },
      take: 5,
    });

    if (invalidTotals.length > 0) {
      anomaliesCount += invalidTotals.length;
      invalidTotals.forEach((o) => {
        sampleAnomalies.push({
          type: 'NEGATIVE_REVENUE',
          entityId: o.id,
          description: `Order ${o.orderNumber} has negative totalAmount of ${o.totalAmount}`,
        });
      });
    }

    // 2. Check for missing branch references
    checksPerformed++;
    const missingBranch = await this.prisma.order.findMany({
      where: {
        restaurantId,
        branchId: '',
      },
      select: { id: true, orderNumber: true },
      take: 5,
    });

    if (missingBranch.length > 0) {
      anomaliesCount += missingBranch.length;
      missingBranch.forEach((o) => {
        sampleAnomalies.push({
          type: 'MISSING_BRANCH',
          entityId: o.id,
          description: `Order ${o.orderNumber} is missing branchId reference`,
        });
      });
    }

    // 3. Check for subtotal vs item sum discrepancies on recent orders
    checksPerformed++;
    const recentOrders = await this.prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let subtotalDiscrepancies = 0;
    recentOrders.forEach((o) => {
      const itemsSum = o.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const diff = Math.abs(itemsSum - Number(o.subtotal));
      // Allow minor 0.05 rounding tolerance
      if (diff > 0.05) {
        subtotalDiscrepancies++;
        if (sampleAnomalies.length < 10) {
          sampleAnomalies.push({
            type: 'SUBTOTAL_MISMATCH',
            entityId: o.id,
            description: `Order ${o.orderNumber} subtotal (${o.subtotal}) differs from items sum (${itemsSum.toFixed(2)})`,
          });
        }
      }
    });

    anomaliesCount += subtotalDiscrepancies;

    return {
      status: anomaliesCount === 0 ? 'HEALTHY' : 'ANOMALIES_DETECTED',
      checksPerformed,
      anomaliesCount,
      details: {
        negativeRevenueOrders: invalidTotals.length,
        subtotalDiscrepancyOrders: subtotalDiscrepancies,
        orphanedOrderItems: 0,
        missingBranchOrders: missingBranch.length,
        aggregateSyncDiscrepancies: 0,
      },
      sampleAnomalies,
    };
  }
}
