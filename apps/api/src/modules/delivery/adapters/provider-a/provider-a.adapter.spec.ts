import { Test, TestingModule } from '@nestjs/testing';
import { ProviderAAdapter } from './provider-a.adapter';
import { OrderStatus } from '../../../../generated/prisma/enums';

describe('ProviderAAdapter', () => {
  let adapter: ProviderAAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderAAdapter],
    }).compile();

    adapter = module.get<ProviderAAdapter>(ProviderAAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should correctly map external statuses to canonical statuses', () => {
    expect(adapter.mapExternalStatus('PLACED')).toBe(OrderStatus.PENDING);
    expect(adapter.mapExternalStatus('ACCEPTED')).toBe(OrderStatus.CONFIRMED);
    expect(adapter.mapExternalStatus('PREPARING')).toBe(OrderStatus.PREPARING);
    expect(adapter.mapExternalStatus('FOOD_READY')).toBe(OrderStatus.READY);
    expect(adapter.mapExternalStatus('DELIVERED')).toBe(OrderStatus.COMPLETED);
    expect(adapter.mapExternalStatus('CANCELLED')).toBe(OrderStatus.CANCELLED);
  });

  it('should correctly map internal statuses back to external statuses', () => {
    expect(adapter.mapInternalToExternalStatus(OrderStatus.PENDING)).toBe('PLACED');
    expect(adapter.mapInternalToExternalStatus(OrderStatus.CONFIRMED)).toBe('ACCEPTED');
    expect(adapter.mapInternalToExternalStatus(OrderStatus.PREPARING)).toBe('PREPARING');
    expect(adapter.mapInternalToExternalStatus(OrderStatus.READY)).toBe('FOOD_READY');
    expect(adapter.mapInternalToExternalStatus(OrderStatus.COMPLETED)).toBe('DELIVERED');
  });

  it('should reject invalid health credentials', async () => {
    const isHealthy = await adapter.healthCheck({ apiKey: 'INVALID' });
    expect(isHealthy).toBe(false);
  });

  it('should accept valid health credentials', async () => {
    const isHealthy = await adapter.healthCheck({ apiKey: 'PROV_A_secret123' });
    expect(isHealthy).toBe(true);
  });
});
