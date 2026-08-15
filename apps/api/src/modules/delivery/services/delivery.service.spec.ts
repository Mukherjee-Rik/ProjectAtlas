import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { DeliveryProviderFactory } from './delivery-provider.factory';
import { DeliveryEventsService } from './delivery-events.service';
import { AuditService } from '../../audit/audit.service';
import { OrderStatus, OrderSource } from '../../../generated/prisma/enums';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProviderAAdapter } from '../adapters/provider-a/provider-a.adapter';
import { ProviderBAdapter } from '../adapters/provider-b/provider-b.adapter';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prisma: PrismaService;
  let eventsService: DeliveryEventsService;

  const mockPrismaService = {
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    restaurantDeliveryProvider: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    externalOrder: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  const mockAdapter = {
    healthCheck: jest.fn().mockResolvedValue(true),
    mapExternalStatus: jest.fn().mockReturnValue(OrderStatus.PENDING),
    mapInternalToExternalStatus: jest.fn().mockReturnValue('PLACED'),
  };

  const mockFactory = {
    getProvider: jest.fn().mockReturnValue(mockAdapter),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        DeliveryEventsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DeliveryProviderFactory, useValue: mockFactory },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    prisma = module.get<PrismaService>(PrismaService);
    eventsService = module.get<DeliveryEventsService>(DeliveryEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject webhooks with invalid signatures', async () => {
    await expect(
      service.handleWebhook('PROVIDER_A', 'invalid-signature', {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('should block duplicate webhooks through event idempotency checks', async () => {
    mockPrismaService.webhookEvent.findUnique.mockResolvedValueOnce({
      eventId: 'evt-123',
      provider: 'PROVIDER_A',
      status: 'PROCESSED',
    });

    const res = await service.handleWebhook('PROVIDER_A', 'valid-sig', {
      eventId: 'evt-123',
    });

    expect(res.message).toContain('already processed');
    expect(mockPrismaService.webhookEvent.create).not.toHaveBeenCalled();
  });

  it('should ignore out-of-order status webhooks', async () => {
    mockPrismaService.webhookEvent.findUnique.mockResolvedValueOnce(null);
    mockPrismaService.restaurantDeliveryProvider.findUnique.mockResolvedValueOnce({
      enabled: true,
    });
    mockPrismaService.externalOrder.findUnique.mockResolvedValueOnce({
      id: 'ext-m1',
      atlasOrderId: 'ord-123',
      atlasOrder: {
        status: OrderStatus.READY, // Order is already READY
      },
    });

    mockAdapter.mapExternalStatus.mockReturnValueOnce(OrderStatus.PENDING); // Stale PLACED event

    const res = await service.handleWebhook('PROVIDER_A', 'valid-sig', {
      eventId: 'evt-456',
      restaurantId: 'r1',
      eventType: 'STATUS_UPDATED',
      orderId: 'ext-order-123',
      externalStatus: 'PLACED',
    });

    expect(res.message).toContain('Stale out-of-order status update ignored');
    expect(mockPrismaService.order.update).not.toHaveBeenCalled();
  });

  it('should reject order cancellations if order is already served or completed', async () => {
    mockPrismaService.webhookEvent.findUnique.mockResolvedValueOnce(null);
    mockPrismaService.restaurantDeliveryProvider.findUnique.mockResolvedValueOnce({
      enabled: true,
    });
    mockPrismaService.externalOrder.findUnique.mockResolvedValueOnce({
      id: 'ext-m1',
      atlasOrderId: 'ord-123',
      atlasOrder: {
        status: OrderStatus.COMPLETED, // Already completed
      },
    });

    await expect(
      service.handleWebhook('PROVIDER_A', 'valid-sig', {
        eventId: 'evt-789',
        restaurantId: 'r1',
        eventType: 'ORDER_CANCELLED',
        orderId: 'ext-order-123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reactively sync internal status updates to delivery providers', async () => {
    mockPrismaService.externalOrder.findUnique.mockResolvedValueOnce({
      provider: 'PROVIDER_A',
      externalOrderId: 'ext-123',
    });
    mockPrismaService.restaurantDeliveryProvider.findUnique.mockResolvedValueOnce({
      enabled: true,
    });

    // Trigger reactive RxJS event
    eventsService.emitOrderStatusUpdated('ord-123', OrderStatus.PREPARING, 'res-1');

    // Give microtask queue time to run subscription handler
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELIVERY_ORDER_STATUS_SENT',
        resourceId: 'ord-123',
      }),
    );
  });
});
