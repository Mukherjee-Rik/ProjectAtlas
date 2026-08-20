import { Test, TestingModule } from '@nestjs/testing';
import { KpiEngineService } from './kpi-engine.service';
import { ComparisonEngineService } from './comparison-engine.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('Analytics Golden Dataset Verification', () => {
  let kpiEngine: KpiEngineService;
  let prismaMock: any;

  beforeEach(async () => {
    // Generate deterministic 100 mock orders
    const mockOrders: any[] = [];

    // 1. 85 Completed Orders (₹600 each, ₹50 discount on 15 of them)
    for (let i = 1; i <= 85; i++) {
      const hasDiscount = i <= 15;
      const discount = hasDiscount ? 50 : 0;
      const subtotal = 550;
      const tax = 50;
      const total = subtotal - discount + tax; // 550 - 50 + 50 = 550 or 600

      mockOrders.push({
        id: `order-comp-${i}`,
        status: 'COMPLETED',
        subtotal: subtotal.toString(),
        taxAmount: tax.toString(),
        discountAmount: discount.toString(),
        totalAmount: total.toString(),
        customerId: `cust-${(i % 10) + 1}`,
        customerSessionId: null,
        refunds: i <= 5 ? [{ amount: '200.00', status: 'SUCCESS' }] : [],
      });
    }

    // 2. 10 Cancelled Orders (₹480 each)
    for (let i = 1; i <= 10; i++) {
      mockOrders.push({
        id: `order-canc-${i}`,
        status: 'CANCELLED',
        subtotal: '450.00',
        taxAmount: '30.00',
        discountAmount: '0.00',
        totalAmount: '480.00',
        customerId: `cust-${(i % 10) + 1}`,
        customerSessionId: null,
        refunds: [],
      });
    }

    // 3. 5 Pending Orders (₹500 each)
    for (let i = 1; i <= 5; i++) {
      mockOrders.push({
        id: `order-pend-${i}`,
        status: 'PENDING',
        subtotal: '450.00',
        taxAmount: '50.00',
        discountAmount: '0.00',
        totalAmount: '500.00',
        customerId: `cust-${(i % 10) + 1}`,
        customerSessionId: null,
        refunds: [],
      });
    }

    prismaMock = {
      order: {
        findMany: jest.fn().mockResolvedValue(mockOrders),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiEngineService,
        ComparisonEngineService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    kpiEngine = module.get<KpiEngineService>(KpiEngineService);
  });

  it('should reconcile golden dataset metrics correctly', async () => {
    const result = await kpiEngine.computeKpis('golden-rest-id', {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
    });

    const kpiMap = new Map(result.kpis.map((k) => [k.key, k]));

    // Total orders must equal 100
    expect(kpiMap.get('total_orders')?.value).toBe(100);

    // Cancellation rate must be exactly 10.0% (10 out of 100)
    expect(kpiMap.get('cancellation_rate')?.value).toBe(10.0);

    // Active customers must be exactly 10
    expect(kpiMap.get('unique_customers')?.value).toBe(10);

    // Repeat customer rate must be 100% since 100 orders are distributed across 10 customers
    expect(kpiMap.get('repeat_customer_rate')?.value).toBe(100.0);

    // Verify refund rate > 0
    expect(kpiMap.get('refund_rate')?.value).toBeGreaterThan(0);
  });
});
