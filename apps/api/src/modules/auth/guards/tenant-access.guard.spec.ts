import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantAccessGuard } from './tenant-access.guard';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('TenantAccessGuard', () => {
  let guard: TenantAccessGuard;
  let prismaService: any;

  const validTenantId = '123e4567-e89b-12d3-a456-426614174000';
  const invalidTenantId = 'not-a-valid-uuid';

  beforeEach(async () => {
    prismaService = {
      tenant: {
        findUnique: jest.fn(),
      },
      tenantMembership: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAccessGuard,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    guard = module.get<TenantAccessGuard>(TenantAccessGuard);
  });

  function createMockExecutionContext(user: any, headers: any = {}, params: any = {}): ExecutionContext {
    const req = { user, params, query: {}, headers, body: {} };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  }

  it('should throw BadRequestException if no tenant is selected', async () => {
    const context = createMockExecutionContext({ id: 'u-1', role: 'USER' });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if tenant ID is not a valid UUID', async () => {
    const context = createMockExecutionContext(
      { id: 'u-1', role: 'USER' },
      { 'x-tenant-id': invalidTenantId },
    );
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should allow ADMIN access to any valid tenant', async () => {
    prismaService.tenant.findUnique.mockResolvedValue({
      id: validTenantId,
      name: 'Tenant A',
      slug: 'tenant-a',
      status: 'ACTIVE',
    });

    const context = createMockExecutionContext(
      { id: 'u-1', role: 'ADMIN' },
      { 'x-tenant-id': validTenantId },
    );
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow USER access if membership exists', async () => {
    prismaService.tenant.findUnique.mockResolvedValue({
      id: validTenantId,
      name: 'Tenant A',
      slug: 'tenant-a',
      status: 'ACTIVE',
    });
    prismaService.tenantMembership.findUnique.mockResolvedValue({
      id: 'tm-1',
      userId: 'u-1',
      tenantId: validTenantId,
    });

    const context = createMockExecutionContext(
      { id: 'u-1', role: 'USER' },
      { 'x-tenant-id': validTenantId },
    );
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user lacks membership to target tenant', async () => {
    prismaService.tenant.findUnique.mockResolvedValue({
      id: validTenantId,
      name: 'Tenant B',
      slug: 'tenant-b',
      status: 'ACTIVE',
    });
    prismaService.tenantMembership.findUnique.mockResolvedValue(null);

    const context = createMockExecutionContext(
      { id: 'u-1', role: 'USER' },
      { 'x-tenant-id': validTenantId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
