import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportValidatorService } from './report-validator.service';

describe('ReportValidatorService', () => {
  let validator: ReportValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportValidatorService],
    }).compile();

    validator = module.get<ReportValidatorService>(ReportValidatorService);
  });

  it('should accept valid report configuration', () => {
    expect(() =>
      validator.validate('SALES', {
        metrics: ['GROSS_SALES', 'TOTAL_ORDERS'],
        dimensions: ['BRANCH'],
        filters: [{ field: 'status', operator: 'EQUALS', value: 'COMPLETED' }],
        dateRange: { preset: 'THIS_MONTH' },
        visualization: { type: 'BAR_CHART' },
        limit: 10,
      }),
    ).not.toThrow();
  });

  it('should reject unknown data source', () => {
    expect(() =>
      validator.validate('INVALID_SOURCE', {
        metrics: ['GROSS_SALES'],
        dimensions: ['BRANCH'],
        dateRange: { preset: 'TODAY' },
        visualization: { type: 'TABLE' },
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject unapproved metric', () => {
    expect(() =>
      validator.validate('SALES', {
        metrics: ['MALICIOUS_METRIC_NAME'],
        dimensions: ['BRANCH'],
        dateRange: { preset: 'TODAY' },
        visualization: { type: 'TABLE' },
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject SQL injection payloads in filters', () => {
    expect(() =>
      validator.validate('SALES', {
        metrics: ['GROSS_SALES'],
        dimensions: ['BRANCH'],
        filters: [{ field: 'branchId', operator: 'EQUALS', value: "1; DROP TABLE orders; --" }],
        dateRange: { preset: 'TODAY' },
        visualization: { type: 'TABLE' },
      }),
    ).toThrow(BadRequestException);
  });
});
