import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should create a new tenant', async () => {
    prismaService.tenant.findUnique.mockResolvedValue(null);
    const mockTenant = {
      id: 't-1',
      name: 'Tenant 1',
      slug: 'tenant-1',
      status: 'ACTIVE',
    };
    prismaService.tenant.create.mockResolvedValue(mockTenant);

    const result = await service.create({
      name: 'Tenant 1',
      slug: 'tenant-1',
    });

    expect(result).toEqual(mockTenant);
  });

  it('findAll should return all tenants', async () => {
    prismaService.tenant.findMany.mockResolvedValue([{ id: 't-1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });
});
