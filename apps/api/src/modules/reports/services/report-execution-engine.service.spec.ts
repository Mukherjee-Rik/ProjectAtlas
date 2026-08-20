import { Test, TestingModule } from '@nestjs/testing';
import { ReportExecutionEngineService } from './report-execution-engine.service';
import { ReportValidatorService } from './report-validator.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('ReportExecutionEngineService', () => {
  let engine: ReportExecutionEngineService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      order: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ord-1',
            createdAt: new Date('2026-08-10T12:00:00Z'),
            branchId: 'b-1',
            status: 'COMPLETED',
            totalAmount: '600.00',
            subtotal: '550.00',
            discountAmount: '0.00',
            taxAmount: '50.00',
            branch: { name: 'Main Branch' },
            refunds: [],
          },
          {
            id: 'ord-2',
            createdAt: new Date('2026-08-10T13:00:00Z'),
            branchId: 'b-1',
            status: 'CANCELLED',
            totalAmount: '400.00',
            subtotal: '370.00',
            discountAmount: '0.00',
            taxAmount: '30.00',
            branch: { name: 'Main Branch' },
            refunds: [],
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportExecutionEngineService,
        ReportValidatorService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    engine = module.get<ReportExecutionEngineService>(ReportExecutionEngineService);
  });

  it('should resolve relative date range presets accurately', () => {
    const range = engine.resolveDateRange({ preset: 'TODAY' });
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime());
  });

  it('should execute sales report and calculate metrics correctly', async () => {
    const res = await engine.execute('rest-1', 'Test Sales Report', 'SALES', {
      metrics: ['GROSS_SALES', 'NET_SALES', 'CANCELLED_AMOUNT', 'TOTAL_ORDERS'],
      dimensions: ['DATE_DAY'],
      dateRange: { preset: 'THIS_MONTH' },
      visualization: { type: 'TABLE' },
    });

    expect(res.reportName).toBe('Test Sales Report');
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].GROSS_SALES).toBe(1000.0);
    expect(res.rows[0].NET_SALES).toBe(550.0);
    expect(res.rows[0].CANCELLED_AMOUNT).toBe(400.0);
    expect(res.rows[0].TOTAL_ORDERS).toBe(2);
  });
});
