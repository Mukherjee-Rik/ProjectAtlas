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
        count: jest.fn().mockResolvedValue(0),
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

  it('should return all users with metadata', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    ];
    prismaService.user.findMany.mockResolvedValue(mockUsers);
    prismaService.user.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toEqual(mockUsers);
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: {},
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
      skip: 0,
      take: 10,
    });
  });

  it('should filter and paginate users', async () => {
    prismaService.user.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'John Admin',
        email: 'john@example.com',
        phone: null,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    ]);

    prismaService.user.count.mockResolvedValue(21);

    const result = await service.findAll({
      search: 'john',
      role: 'ADMIN' as any,
      status: 'ACTIVE' as any,
      page: 2,
      limit: 10,
    });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });

    expect(result.data).toHaveLength(1);

    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );

    expect(prismaService.user.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'ADMIN',
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('findById should not select passwordHash', async () => {
    const mockUser = {
      id: '1',
      name: 'User 1',
      email: 'u1@example.com',
      role: 'USER',
      status: 'ACTIVE',
    };
    prismaService.user.findFirst.mockResolvedValue(mockUser);

    const result = await service.findById('1');
    expect(result).toEqual(mockUser);
    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { id: '1' },
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

  it('updateMyProfile should update name and phone for current user', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    const mockUpdatedUser = {
      id: 'user-1',
      name: 'Updated Name',
      email: 'user@example.com',
      phone: '+919876543210',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    prismaService.user.update.mockResolvedValue(mockUpdatedUser);

    const result = await service.updateMyProfile('user-1', {
      name: 'Updated Name',
      phone: '+919876543210',
    });

    expect(result).toEqual(mockUpdatedUser);
    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          name: 'Updated Name',
          phone: '+919876543210',
        }),
      }),
    );
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

  it('should create an ADMIN user when role is provided', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);

    prismaService.user.create.mockResolvedValue({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: null,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const result = await service.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'ADMIN' as any,
    });

    expect(result.role).toBe('ADMIN');

    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'ADMIN',
        }),
      }),
    );
  });

  it('should update role and status', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-id',
      status: 'ACTIVE',
    });

    prismaService.user.update.mockResolvedValue({
      id: 'user-id',
      name: 'Updated User',
      email: 'user@example.com',
      phone: null,
      role: 'ADMIN',
      status: 'SUSPENDED',
    });

    const result = await service.update('user-id', {
      role: 'ADMIN' as any,
      status: 'SUSPENDED' as any,
    });

    expect(result.role).toBe('ADMIN');
    expect(result.status).toBe('SUSPENDED');

    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'ADMIN',
          status: 'SUSPENDED',
        }),
      }),
    );
  });

  it('should allow clearing a phone number', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-id',
      status: 'ACTIVE',
    });

    prismaService.user.update.mockResolvedValue({
      id: 'user-id',
      name: 'User',
      email: 'user@example.com',
      phone: null,
      role: 'USER',
      status: 'ACTIVE',
    });

    await service.update('user-id', {
      phone: null,
    });

    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: null,
        }),
      }),
    );
  });

  it('should prevent an admin from deactivating their own account', async () => {
    await expect(
      service.remove('same-user-id', 'same-user-id'),
    ).rejects.toThrow(
      'You cannot deactivate your own account',
    );

    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
  });
});
