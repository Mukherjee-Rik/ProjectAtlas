import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let restaurantsService: any;

  const mockTenant: any = {
    id: 't-1',
    name: 'Tenant 1',
    slug: 'tenant-1',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    restaurantsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [
        TtlCacheService,
        { provide: RestaurantsService, useValue: restaurantsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RestaurantsController>(RestaurantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should pass tenant.id to restaurantsService.findAll', async () => {
    const mockUser: any = { role: 'OWNER' };
    await controller.findAll(mockUser, mockTenant);
    expect(restaurantsService.findAll).toHaveBeenCalledWith('t-1');
  });

  it('create should pass tenant.id and dto to restaurantsService.create', async () => {
    const dto = { name: 'Rest 1', slug: 'rest-1' };
    await controller.create(mockTenant, dto);
    expect(restaurantsService.create).toHaveBeenCalledWith('t-1', dto);
  });
});
