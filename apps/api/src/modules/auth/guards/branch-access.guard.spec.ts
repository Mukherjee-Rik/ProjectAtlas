import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BranchAccessGuard } from './branch-access.guard';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';

describe('BranchAccessGuard', () => {
  let guard: BranchAccessGuard;
  let prismaService: any;

  const validBranchId = '123e4567-e89b-12d3-a456-426614174000';
  const restaurantId = '123e4567-e89b-12d3-a456-426614174001';
  const tenantId = '123e4567-e89b-12d3-a456-426614174002';
  const otherTenantId = '123e4567-e89b-12d3-a456-426614174003';

  beforeEach(async () => {
    prismaService = {
      branch: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtlCacheService,
        BranchAccessGuard,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    guard = module.get<BranchAccessGuard>(BranchAccessGuard);
  });

  function createMockExecutionContext(user: any, tenant: any, restaurant: any, headers: any = {}): ExecutionContext {
    const req = { user, tenant, restaurant, params: {}, query: {}, headers, body: {} };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  }

  it('should allow access if no branch is targeted', async () => {
    const context = createMockExecutionContext({ id: 'u-1' }, { id: tenantId }, { id: restaurantId });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw BadRequestException if branch ID is invalid UUID', async () => {
    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { id: restaurantId },
      { 'x-branch-id': 'invalid-uuid' },
    );
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if branch belongs to another tenant', async () => {
    prismaService.branch.findUnique.mockResolvedValue({
      id: validBranchId,
      name: 'Branch B',
      code: 'B-01',
      restaurantId,
      restaurant: { tenantId: otherTenantId },
    });

    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { id: restaurantId },
      { 'x-branch-id': validBranchId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access and populate request.branch when valid', async () => {
    prismaService.branch.findUnique.mockResolvedValue({
      id: validBranchId,
      name: 'Branch A',
      code: 'A-01',
      restaurantId,
      restaurant: { tenantId },
    });

    const context = createMockExecutionContext(
      { id: 'u-1' },
      { id: tenantId },
      { id: restaurantId },
      { 'x-branch-id': validBranchId },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
