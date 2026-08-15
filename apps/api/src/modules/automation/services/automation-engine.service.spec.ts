import { Test, TestingModule } from '@nestjs/testing';
import { AutomationEngineService } from './automation-engine.service';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AiContextService } from '../../ai/services/ai-context.service';
import { NotificationService } from './notification.service';
import { AuditService } from '../../audit/audit.service';

describe('AutomationEngineService', () => {
  let engine: AutomationEngineService;
  let prisma: any;
  let contextService: any;
  let notificationService: any;
  let auditService: any;

  const mockRule = {
    id: 'rule-1',
    restaurantId: 'rest-1',
    name: 'High Cancellation Alert',
    description: null,
    enabled: true,
    triggerType: 'EVENT',
    schedule: null,
    eventType: 'ORDER_CANCELLED',
    conditionType: 'CANCELLATIONS_ABOVE',
    conditionValue: 3,
    actionType: 'SEND_NOTIFICATION',
    cooldownMinutes: 360,
    lastTriggeredAt: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      automationRule: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      automationExecution: {
        create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
        update: jest.fn(),
      },
    };

    contextService = {
      getSalesContext: jest.fn().mockResolvedValue({
        totalSales: 5000, totalOrders: 20, averageOrderValue: 250,
        topItem: 'Butter Chicken', topItemQty: 10, peakHours: '7 PM - 9 PM',
      }),
      getOrderContext: jest.fn().mockResolvedValue({
        totalOrders: 25,
        statusBreakdown: { PENDING: 2, CONFIRMED: 8, DELIVERED: 12, CANCELLED: 3 },
      }),
      getOperationsContext: jest.fn().mockResolvedValue({
        totalOrders: 25, cancelledOrders: 5, cancellationRate: 20, peakHours: '7 PM - 9 PM',
      }),
      getCustomerContext: jest.fn().mockResolvedValue({
        totalCustomers: 18, repeatCustomers: 4,
      }),
    };

    notificationService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    auditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationEngineService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiContextService, useValue: contextService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    engine = module.get(AutomationEngineService);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('evaluateRule', () => {
    it('should return false for non-existent rule', async () => {
      prisma.automationRule.findUnique.mockResolvedValue(null);
      expect(await engine.evaluateRule('non-existent')).toBe(false);
    });

    it('should return false for disabled rule', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({ ...mockRule, enabled: false });
      expect(await engine.evaluateRule('rule-1')).toBe(false);
    });

    it('should enforce cooldown and return false when in cooldown', async () => {
      const recentTrigger = new Date(Date.now() - 60 * 1000); // 1 minute ago
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        lastTriggeredAt: recentTrigger,
        cooldownMinutes: 360,
      });
      expect(await engine.evaluateRule('rule-1')).toBe(false);
    });

    it('should fire when CANCELLATIONS_ABOVE condition is met', async () => {
      prisma.automationRule.findUnique.mockResolvedValue(mockRule);
      // cancelledOrders = 5, conditionValue = 3 → condition met
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(true);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: 'rest-1',
          type: 'ALERT',
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUTOMATION_EXECUTED',
          resourceType: 'AUTOMATION',
        }),
      );
    });

    it('should NOT fire when CANCELLATIONS_ABOVE condition is NOT met', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        conditionValue: 100, // threshold too high
      });
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(false);
    });

    it('should fire SALES_BELOW condition correctly', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        conditionType: 'SALES_BELOW',
        conditionValue: 10000, // sales are 5000, which is below 10000
      });
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(true);
    });

    it('should fire ORDERS_ABOVE condition correctly', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        conditionType: 'ORDERS_ABOVE',
        conditionValue: 20, // totalOrders is 25 > 20
      });
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(true);
    });

    it('should handle GENERATE_REPORT action', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        conditionType: null,
        conditionValue: null,
        actionType: 'GENERATE_REPORT',
      });
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(true);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REPORT',
        }),
      );
    });

    it('should handle CREATE_AI_INSIGHT action', async () => {
      prisma.automationRule.findUnique.mockResolvedValue({
        ...mockRule,
        conditionType: null,
        conditionValue: null,
        actionType: 'CREATE_AI_INSIGHT',
      });
      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(true);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'AI_INSIGHT',
        }),
      );
    });

    it('should record execution on failure', async () => {
      prisma.automationRule.findUnique.mockResolvedValue(mockRule);
      notificationService.create.mockRejectedValue(new Error('Send failed'));

      const result = await engine.evaluateRule('rule-1');
      expect(result).toBe(false);
      expect(prisma.automationExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });
  });

  describe('tenant isolation', () => {
    it('should scope operations to the rule restaurantId', async () => {
      prisma.automationRule.findUnique.mockResolvedValue(mockRule);
      await engine.evaluateRule('rule-1');

      // Verify the context service was called with the rule's restaurantId
      expect(contextService.getOperationsContext).toHaveBeenCalledWith(
        'rest-1',
        expect.any(Date),
        expect.any(Date),
      );
    });
  });
});
