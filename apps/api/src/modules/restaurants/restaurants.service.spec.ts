import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 't-1' }),
      },
      restaurant: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should create a restaurant under tenantId', async () => {
    prismaService.restaurant.findUnique.mockResolvedValue(null);
    const mockRestaurant = {
      id: 'r-1',
      tenantId: 't-1',
      name: 'Restaurant 1',
      slug: 'restaurant-1',
    };
    prismaService.restaurant.create.mockResolvedValue(mockRestaurant);

    const result = await service.create('t-1', {
      name: 'Restaurant 1',
      slug: 'restaurant-1',
    });

    expect(result).toEqual(mockRestaurant);
  });

  it('findAll should filter by tenantId when provided', async () => {
    await service.findAll('t-1');
    expect(prismaService.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 't-1' },
      }),
    );
  });
});
