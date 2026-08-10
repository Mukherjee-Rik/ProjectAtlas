import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('BranchesController', () => {
  let controller: BranchesController;
  let service: any;

  const mockTenant: any = {
    id: 'tenant-a',
    name: 'Tenant A',
    slug: 'tenant-a',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        { provide: BranchesService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should pass tenant.id and restaurantId query to service.findAll', async () => {
    await controller.findAll(mockTenant, 'rest-1');
    expect(service.findAll).toHaveBeenCalledWith('tenant-a', 'rest-1');
  });

  it('create should pass tenant.id and dto to service.create', async () => {
    const dto = { restaurantId: 'rest-1', name: 'Branch 1', code: 'B-01' };
    await controller.create(mockTenant, dto);
    expect(service.create).toHaveBeenCalledWith('tenant-a', dto);
  });
});
