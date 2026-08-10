import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return aggregated overview numbers and recent users', async () => {
    prismaService.user.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2);

    const mockRecentUsers = [
      {
        id: 'u-1',
        name: 'Recent User',
        email: 'recent@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    ];

    prismaService.user.findMany.mockResolvedValue(mockRecentUsers);

    const result = await service.getOverview();

    expect(result).toEqual({
      users: {
        total: 10,
        active: 8,
        admins: 2,
      },
      recentUsers: mockRecentUsers,
    });
    expect(prismaService.user.count).toHaveBeenCalledTimes(3);
    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  });
});
