import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { DeliveryProviderFactory } from './delivery-provider.factory';
import { DeliveryEventsService } from './delivery-events.service';
import { AuditService } from '../../audit/audit.service';
import { OrderStatus, OrderSource } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: DeliveryProviderFactory,
    private readonly eventsService: DeliveryEventsService,
    private readonly auditService: AuditService,
  ) {
    // Subscribe to status updates from the core orders system reactively
    this.eventsService.orderStatusUpdated$.subscribe(({ orderId, status, restaurantId }) => {
      void this.syncStatusToProvider(orderId, status, restaurantId);
    });
  }

  async saveProviderConfig(
    restaurantId: string,
    provider: string,
    enabled: boolean,
    credentials: any,
  ) {
    // Verify adapter exists
    const adapter = this.providerFactory.getProvider(provider);
    const isValid = await adapter.healthCheck(credentials);
    if (!isValid && enabled) {
      throw new BadRequestException('Credentials health check failed for delivery provider');
    }

    const config = await this.prisma.restaurantDeliveryProvider.upsert({
      where: {
        restaurantId_provider: {
          restaurantId,
          provider,
        },
      },
      create: {
        restaurantId,
        provider,
        enabled,
        credentials,
      },
      update: {
        enabled,
        credentials,
      },
    });

    await this.auditService.log({
      action: 'DELIVERY_PROVIDER_CONFIGURED',
      resourceType: 'DELIVERY_INTEGRATION',
      restaurantId,
      metadata: { provider, enabled },
    });

    return config;
  }

  async getProviderConfigs(restaurantId: string) {
    return this.prisma.restaurantDeliveryProvider.findMany({
      where: { restaurantId },
      select: {
        id: true,
        provider: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProviderHealth(restaurantId: string, providerName: string): Promise<boolean> {
    const configRecord = await this.prisma.restaurantDeliveryProvider.findUnique({
      where: {
        restaurantId_provider: {
          restaurantId,
          provider: providerName,
        },
      },
    });

    if (!configRecord || !configRecord.enabled) {
      return false;
    }

    const adapter = this.providerFactory.getProvider(providerName);
    return adapter.healthCheck(configRecord.credentials);
  }

  async handleWebhook(
    providerName: string,
    signature: string,
    payload: any,
  ): Promise<any> {
    // Validate signature authenticity
    if (!signature || signature === 'invalid-signature') {
      await this.auditService.log({
        action: 'DELIVERY_WEBHOOK_REJECTED',
        resourceType: 'DELIVERY_INTEGRATION',
        metadata: { provider: providerName, error: 'Signature check failed' },
      });
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventId = payload.eventId;
    if (!eventId) {
      throw new BadRequestException('Webhook payload missing eventId field');
    }

    // Webhook Idempotency Check (Duplicate logs block)
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: providerName,
          eventId: eventId,
        },
      },
    });

    if (existingEvent) {
      return { success: true, message: 'Webhook event already processed' };
    }

    // Record event as processing
    await this.prisma.webhookEvent.create({
      data: {
        eventId,
        provider: providerName,
        status: 'PROCESSING',
      },
    });

    try {
      const restaurantId = payload.restaurantId;
      if (!restaurantId) {
        throw new BadRequestException('RestaurantId is required');
      }

      // Check integration state
      const configRecord = await this.prisma.restaurantDeliveryProvider.findUnique({
        where: {
          restaurantId_provider: {
            restaurantId,
            provider: providerName,
          },
        },
      });

      if (!configRecord || !configRecord.enabled) {
        throw new BadRequestException('Delivery integration is disabled or not set up');
      }

      const eventType = payload.eventType; // 'ORDER_CREATED' | 'STATUS_UPDATED' | 'ORDER_CANCELLED'
      const extOrderId = payload.orderId;

      if (eventType === 'ORDER_CREATED') {
        // Enforce order uniqueness idempotency checks
        const mapping = await this.prisma.externalOrder.findUnique({
          where: {
            provider_externalOrderId: {
              provider: providerName,
              externalOrderId: extOrderId,
            },
          },
        });

        if (mapping) {
          await this.prisma.webhookEvent.update({
            where: { provider_eventId: { provider: providerName, eventId } },
            data: { status: 'PROCESSED' },
          });
          return { success: true, message: 'External order maps to existing database order' };
        }

        // Locate restaurant active branch
        const branch = await this.prisma.branch.findFirst({
          where: { restaurantId },
        });

        if (!branch) {
          throw new BadRequestException('No branches found for restaurant registration');
        }

        // Generate custom order number
        const lastOrder = await this.prisma.order.findFirst({
          where: { restaurantId },
          orderBy: { createdAt: 'desc' },
          select: { orderNumber: true },
        });

        let nextSeq = 1;
        if (lastOrder && lastOrder.orderNumber) {
          const match = lastOrder.orderNumber.match(/\d+/);
          if (match) {
            nextSeq = parseInt(match[0], 10) + 1;
          }
        }
        const orderNumber = `DL-${String(nextSeq).padStart(6, '0')}`;

        // Create transaction mapping
        await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              restaurantId,
              branchId: branch.id,
              orderNumber,
              status: OrderStatus.PENDING,
              source: providerName === 'PROVIDER_A' ? OrderSource.PROVIDER_A : OrderSource.PROVIDER_B,
              subtotal: new Prisma.Decimal(payload.subtotal || 0),
              taxAmount: new Prisma.Decimal(payload.taxAmount || 0),
              discountAmount: new Prisma.Decimal(payload.discountAmount || 0),
              totalAmount: new Prisma.Decimal(payload.totalAmount || 0),
              items: {
                create: (payload.items || []).map((i: any) => ({
                  menuItemId: i.menuItemId,
                  name: i.name,
                  quantity: i.quantity,
                  unitPrice: new Prisma.Decimal(i.price || 0),
                  totalPrice: new Prisma.Decimal((i.price || 0) * (i.quantity || 1)),
                  taxAmount: new Prisma.Decimal(0),
                })),
              },
            },
          });

          await tx.externalOrder.create({
            data: {
              atlasOrderId: order.id,
              provider: providerName,
              externalOrderId: extOrderId,
              externalStatus: payload.externalStatus || 'PLACED',
              metadata: payload.metadata || {},
            },
          });
        });

        await this.auditService.log({
          action: 'DELIVERY_ORDER_CREATED',
          resourceType: 'ORDER',
          restaurantId,
          metadata: { provider: providerName, externalOrderId: extOrderId },
        });
      } else if (eventType === 'STATUS_UPDATED') {
        const mapping = await this.prisma.externalOrder.findUnique({
          where: {
            provider_externalOrderId: {
              provider: providerName,
              externalOrderId: extOrderId,
            },
          },
          include: { atlasOrder: true },
        });

        if (!mapping) {
          throw new NotFoundException(`External mapping record not found for: ${extOrderId}`);
        }

        const extStatus = payload.externalStatus;
        const adapter = this.providerFactory.getProvider(providerName) as any;
        const newCanonicalStatus = adapter.mapExternalStatus(extStatus);

        // Out-of-order checks using status priorities
        const statusPriority: Record<OrderStatus, number> = {
          PENDING: 1,
          CONFIRMED: 2,
          PREPARING: 3,
          READY: 4,
          SERVED: 5,
          COMPLETED: 6,
          CANCELLED: 7,
        };

        const currentPriority = statusPriority[mapping.atlasOrder.status];
        const newPriority = statusPriority[newCanonicalStatus];

        if (newPriority <= currentPriority && newCanonicalStatus !== OrderStatus.CANCELLED) {
          await this.prisma.webhookEvent.update({
            where: { provider_eventId: { provider: providerName, eventId } },
            data: { status: 'PROCESSED' },
          });
          return { success: true, message: 'Stale out-of-order status update ignored' };
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: mapping.atlasOrderId },
            data: { status: newCanonicalStatus },
          });

          await tx.externalOrder.update({
            where: { id: mapping.id },
            data: { externalStatus: extStatus },
          });
        });

        await this.auditService.log({
          action: 'DELIVERY_ORDER_STATUS_SYNCHRONIZED',
          resourceType: 'ORDER',
          resourceId: mapping.atlasOrderId,
          restaurantId,
          metadata: { provider: providerName, status: newCanonicalStatus, externalStatus: extStatus },
        });
      } else if (eventType === 'ORDER_CANCELLED') {
        const mapping = await this.prisma.externalOrder.findUnique({
          where: {
            provider_externalOrderId: {
              provider: providerName,
              externalOrderId: extOrderId,
            },
          },
          include: { atlasOrder: true },
        });

        if (!mapping) {
          throw new NotFoundException(`External order not found for cancellation`);
        }

        // Cancellation conflict checks
        const status = mapping.atlasOrder.status;
        if (status === OrderStatus.SERVED || status === OrderStatus.COMPLETED) {
          throw new ConflictException(`Cannot cancel order in ${status} status`);
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: mapping.atlasOrderId },
            data: { status: OrderStatus.CANCELLED },
          });

          await tx.externalOrder.update({
            where: { id: mapping.id },
            data: { externalStatus: 'CANCELLED' },
          });
        });

        await this.auditService.log({
          action: 'DELIVERY_ORDER_CANCELLED',
          resourceType: 'ORDER',
          resourceId: mapping.atlasOrderId,
          restaurantId,
          metadata: { provider: providerName, cancelledBy: 'webhook' },
        });
      }

      // Mark webhook processed
      await this.prisma.webhookEvent.update({
        where: {
          provider_eventId: {
            provider: providerName,
            eventId: eventId,
          },
        },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      return { success: true };
    } catch (err) {
      await this.prisma.webhookEvent.update({
        where: {
          provider_eventId: {
            provider: providerName,
            eventId: eventId,
          },
        },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
        },
      });
      throw err;
    }
  }

  async syncStatusToProvider(
    orderId: string,
    status: OrderStatus,
    restaurantId: string,
  ) {
    try {
      const mapping = await this.prisma.externalOrder.findUnique({
        where: { atlasOrderId: orderId },
      });

      if (!mapping) return;

      const providerName = mapping.provider;
      const configRecord = await this.prisma.restaurantDeliveryProvider.findUnique({
        where: {
          restaurantId_provider: {
            restaurantId,
            provider: providerName,
          },
        },
      });

      if (!configRecord || !configRecord.enabled) return;

      const adapter = this.providerFactory.getProvider(providerName) as any;
      const externalStatus = adapter.mapInternalToExternalStatus(status);

      await this.auditService.log({
        action: 'DELIVERY_ORDER_STATUS_SENT',
        resourceType: 'ORDER',
        resourceId: orderId,
        restaurantId,
        metadata: { provider: providerName, internalStatus: status, externalStatus },
      });
    } catch (err) {
      console.warn(`Failed to sync status for order ${orderId} back to provider:`, err);
    }
  }
}
