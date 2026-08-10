import { Test, TestingModule } from '@nestjs/testing';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TablesController', () => {
  let controller: TablesController;
  let service: any;

  const mockBranch: any = {
    id: 'branch-a',
    name: 'Branch A',
    code: 'B-01',
    restaurantId: 'rest-a',
    tenantId: 'tenant-a',
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
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TablesController>(TablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should pass branch.id and query to service.findAll', async () => {
    await controller.findAll(mockBranch, 'da-1');
    expect(service.findAll).toHaveBeenCalledWith('branch-a', 'da-1');
  });

  it('create should pass branch.id and dto to service.create', async () => {
    const dto = { diningAreaId: 'da-1', name: 'T1', code: 'T01', capacity: 4 };
    await controller.create(mockBranch, dto);
    expect(service.create).toHaveBeenCalledWith('branch-a', dto);
  });
});
