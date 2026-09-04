import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import type { OperationalEventType } from '../constants/canonical-metrics.constants';

export interface EmitEventParams {
  tenantId: string;
  restaurantId: string;
  branchId: string;
  eventType: OperationalEventType | string;
  entityType:
    'ORDER' | 'PAYMENT' | 'CUSTOMER' | 'MENU_ITEM' | 'STOCK' | 'STAFF';
  entityId: string;
  actorUserId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class OperationalEventService {
  private readonly logger = new Logger(OperationalEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Emits an operational event, writing to the persistent append-only event stream.
   */
  async emit(params: EmitEventParams): Promise<void> {
    try {
      await this.prisma.operationalEvent.create({
        data: {
          tenantId: params.tenantId,
          restaurantId: params.restaurantId,
          branchId: params.branchId,
          eventType: params.eventType,
          entityType: params.entityType,
          entityId: params.entityId,
          actorUserId: params.actorUserId,
          metadata: params.metadata ?? {},
          timestamp: params.timestamp ?? new Date(),
        },
      });

      this.logger.debug(
        `[Event Emitted] ${params.eventType} for ${params.entityType}:${params.entityId} (Branch: ${params.branchId})`,
      );
    } catch (err: any) {
      // Event persistence should never crash the main transaction thread
      this.logger.error(
        `Failed to persist operational event ${params.eventType}: ${err?.message}`,
        err?.stack,
      );
    }
  }

  /**
   * Queries historical operational event telemetry with multi-tenant filtering.
   */
  async queryEvents(
    restaurantId: string,
    options?: {
      branchId?: string;
      eventType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ) {
    const where: any = { restaurantId };

    if (options?.branchId) where.branchId = options.branchId;
    if (options?.eventType) where.eventType = options.eventType;
    if (options?.entityId) where.entityId = options.entityId;

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    return this.prisma.operationalEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 50,
    });
  }
}
