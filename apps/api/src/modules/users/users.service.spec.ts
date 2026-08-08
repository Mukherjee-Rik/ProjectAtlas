import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all active users without passwordHash', async () => {
    const mockUsers = [
      { id: '1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE' },
    ];
    prismaService.user.findMany.mockResolvedValue(mockUsers);

    const result = await service.findAll();
    expect(result).toEqual(mockUsers);
    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findById should not select passwordHash', async () => {
    const mockUser = { id: '1', name: 'User 1', email: 'u1@example.com', role: 'USER', status: 'ACTIVE' };
    prismaService.user.findFirst.mockResolvedValue(mockUser);

    const result = await service.findById('1');
    expect(result).toEqual(mockUser);
    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { id: '1', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('create should not return passwordHash in select', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'new-id',
      name: 'New User',
      email: 'new@example.com',
      phone: null,
      role: 'USER',
      status: 'ACTIVE',
    });

    const result = await service.create({
      name: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
    });

    expect(result).not.toHaveProperty('passwordHash');
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'New User',
        email: 'new@example.com',
      }),
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});
