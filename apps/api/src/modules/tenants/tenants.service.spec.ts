import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TenantsService.findAllForUser', () => {
  let service: TenantsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('restricts a normal user to tenants they are a member of', async () => {
    await service.findAllForUser('u-1', 'OWNER');

    const args = prisma.tenant.findMany.mock.calls[0][0];

    // The whole point of the fix: an owner must not see other businesses.
    expect(args.where).toEqual({ memberships: { some: { userId: 'u-1' } } });
  });

  it('lets PLATFORM_ADMIN see every tenant', async () => {
    await service.findAllForUser('admin-1', 'PLATFORM_ADMIN');

    const args = prisma.tenant.findMany.mock.calls[0][0];
    expect(args.where).toBeUndefined();
  });

  it('restricts ADMIN to member tenants', async () => {
    await service.findAllForUser('admin-1', 'ADMIN');

    const args = prisma.tenant.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      memberships: { some: { userId: 'admin-1' } },
    });
  });

  it('does not widen access for an unrecognised role', async () => {
    await service.findAllForUser('u-2', 'SOMETHING_NEW');

    const args = prisma.tenant.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ memberships: { some: { userId: 'u-2' } } });
  });
});
