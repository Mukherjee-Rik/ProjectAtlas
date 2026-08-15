import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AiContextService } from './ai-context.service';
import { AiProviderService } from './ai-provider.service';
import { AuditService } from '../../audit/audit.service';
import { UserRole } from '../../../generated/prisma/enums';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AiService', () => {
  let service: AiService;
  let prisma: PrismaService;

  const mockPrismaService = {
    aiUsage: {
      create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockContextService = {
    getOrderContext: jest.fn().mockResolvedValue({ totalOrders: 10, statusBreakdown: {} }),
    getSalesContext: jest.fn().mockResolvedValue({ totalSales: 25000, totalOrders: 10, averageOrderValue: 2500, topItem: 'Chicken Biryani', topItemQty: 10, peakHours: '7 PM - 9 PM' }),
    getCustomerContext: jest.fn().mockResolvedValue({ totalCustomers: 8, repeatCustomers: 2 }),
    getOperationsContext: jest.fn().mockResolvedValue({ totalOrders: 10, cancelledOrders: 1, cancellationRate: 10, peakHours: '7 PM - 9 PM' }),
  };

  const mockProviderService = {
    generate: jest.fn().mockResolvedValue({
      text: 'Mock response explaining ₹25,000 in sales and Chicken Biryani as top item.',
      inputTokens: 50,
      outputTokens: 60,
    }),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiContextService, useValue: mockContextService },
        { provide: AiProviderService, useValue: mockProviderService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully run a query for OWNER and calculate correct context', async () => {
    const res = await service.runQuery('user-1', UserRole.OWNER, 'res-1', 'How were my sales today?');

    expect(res.text).toContain('Mock response explaining');
    expect(mockContextService.getSalesContext).toHaveBeenCalledWith('res-1', expect.any(Date), expect.any(Date));
    expect(mockPrismaService.aiUsage.create).toHaveBeenCalled();
  });

  it('should block financial queries requested by WAITER', async () => {
    await expect(
      service.runQuery('user-2', UserRole.WAITER, 'res-1', 'What is our total revenue this month?'),
    ).rejects.toThrow(ForbiddenException);

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_QUERY_BLOCKED',
      }),
    );
  });

  it('should allow non-financial queries requested by WAITER', async () => {
    const res = await service.runQuery('user-2', UserRole.WAITER, 'res-1', 'How many orders are cancelled?');

    expect(res.text).toBeDefined();
    expect(mockContextService.getOperationsContext).toHaveBeenCalledWith('res-1', expect.any(Date), expect.any(Date));
    // Sales context should not be queried or populated for restricted roles
    expect(mockContextService.getSalesContext).not.toHaveBeenCalled();
  });

  it('should enforce rate limits on excessive user queries', async () => {
    // Fire 20 requests
    for (let i = 0; i < 20; i++) {
      await service.runQuery('user-rate-limit', UserRole.OWNER, 'res-1', 'hello');
    }

    // The 21st request must trigger a rate limit error
    await expect(
      service.runQuery('user-rate-limit', UserRole.OWNER, 'res-1', 'hello'),
    ).rejects.toThrow(BadRequestException);
  });
});
