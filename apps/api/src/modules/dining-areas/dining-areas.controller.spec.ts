import { Test, TestingModule } from '@nestjs/testing';
import { DiningAreasController } from './dining-areas.controller';
import { DiningAreasService } from './dining-areas.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('DiningAreasController', () => {
  let controller: DiningAreasController;
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
      controllers: [DiningAreasController],
      providers: [
        { provide: DiningAreasService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DiningAreasController>(DiningAreasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should pass branch.id to service.findAll', async () => {
    await controller.findAll(mockBranch);
    expect(service.findAll).toHaveBeenCalledWith('branch-a');
  });

  it('create should pass branch.id and dto to service.create', async () => {
    const dto = { name: 'Indoor', code: 'INDOOR' };
    await controller.create(mockBranch, dto);
    expect(service.create).toHaveBeenCalledWith('branch-a', dto);
  });
});
