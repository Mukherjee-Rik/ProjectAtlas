import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantAccessGuard } from './restaurant-access.guard';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';

describe('RestaurantAccessGuard', () => {
  let guard: RestaurantAccessGuard;
  let prismaService: any;

  const validRestaurantId = '123e4567-e89b-12d3-a456-426614174000';
  const tenantId = '123e4567-e89b-12d3-a456-426614174001';
  const otherTenantId = '123e4567-e89b-12d3-a456-426614174002';

  beforeEach(async () => {
    prismaService = {
      restaurant: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtlCacheService,
        RestaurantAccessGuard,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    guard = module.get<RestaurantAccessGuard>(RestaurantAccessGuard);
  });

  function createMockExecutionContext(user: any, tenant: any, headers: any = {}): ExecutionContext {
    const req = { user, tenant, params: {}, query: {}, headers, body: {} };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  }

  it('should allow access if no restaurant is targeted', async () => {
    const context = createMockExecutionContext({ id: 'u-1' }, { id: tenantId });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw BadRequestException if restaurant ID is invalid UUID', async () => {
    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { 'x-restaurant-id': 'invalid-uuid' },
    );
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if restaurant belongs to another tenant', async () => {
    prismaService.restaurant.findUnique.mockResolvedValue({
      id: validRestaurantId,
      name: 'Bistro B',
      tenantId: otherTenantId,
    });

    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { 'x-restaurant-id': validRestaurantId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access and populate request.restaurant when valid', async () => {
    prismaService.restaurant.findUnique.mockResolvedValue({
      id: validRestaurantId,
      name: 'Bistro A',
      tenantId,
    });

    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { 'x-restaurant-id': validRestaurantId },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
