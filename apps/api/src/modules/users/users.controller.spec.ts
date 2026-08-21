import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      findById: jest.fn(),
      updateMyProfile: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        TtlCacheService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMe should call usersService.findById with user id', async () => {
    const mockAuthUser = { id: 'u-1', email: 'user@example.com', role: 'USER' };
    usersService.findById.mockResolvedValue({ id: 'u-1', name: 'User One' });

    const result = await controller.getMe(mockAuthUser);

    expect(usersService.findById).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1', name: 'User One' });
  });

  it('updateMe should call usersService.updateMyProfile with user id and dto', async () => {
    const mockAuthUser = { id: 'u-1', email: 'user@example.com', role: 'USER' };
    const dto = { name: 'New Name', phone: '+919876543210' };
    usersService.updateMyProfile.mockResolvedValue({ id: 'u-1', ...dto });

    const result = await controller.updateMe(mockAuthUser, dto);

    expect(usersService.updateMyProfile).toHaveBeenCalledWith('u-1', dto);
    expect(result).toEqual({ id: 'u-1', ...dto });
  });

  it('findAll should pass query to usersService.findAll', async () => {
    const query = {
      page: 2,
      limit: 10,
      role: 'ADMIN' as const,
    };
    const mockUser: any = { id: 'u-1', role: 'PLATFORM_ADMIN' };

    await controller.findAll(query as any, mockUser, undefined);

    expect(usersService.findAll).toHaveBeenCalledWith(query, undefined);
  });

  it('findById should call usersService.findById with UUID', async () => {
    const mockUser: any = { id: 'u-1', role: 'PLATFORM_ADMIN' };
    await controller.findById(validUuid, mockUser, undefined);
    expect(usersService.findById).toHaveBeenCalledWith(validUuid, undefined);
  });

  it('update should call usersService.update with UUID and dto', async () => {
    const dto = { name: 'Updated' };
    const mockUser: any = { id: 'u-1', role: 'PLATFORM_ADMIN' };
    await controller.update(validUuid, dto, mockUser, undefined);
    expect(usersService.update).toHaveBeenCalledWith(validUuid, dto, undefined);
  });

  it('remove should call usersService.remove with UUID and current user ID', async () => {
    const currentUser: any = {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
    };

    await controller.remove(validUuid, currentUser, undefined);

    expect(usersService.remove).toHaveBeenCalledWith(
      validUuid,
      'admin-id',
      undefined,
    );
  });
});
