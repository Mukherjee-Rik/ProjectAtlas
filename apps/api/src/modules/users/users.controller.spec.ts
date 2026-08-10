import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMe should return current authenticated user', () => {
    const mockAuthUser = { id: 'u-1', email: 'user@example.com', role: 'USER' };
    expect(controller.getMe(mockAuthUser)).toEqual(mockAuthUser);
  });

  it('findAll should call usersService.findAll', async () => {
    await controller.findAll();
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('findById should call usersService.findById with UUID', async () => {
    await controller.findById(validUuid);
    expect(usersService.findById).toHaveBeenCalledWith(validUuid);
  });

  it('update should call usersService.update with UUID and dto', async () => {
    const dto = { name: 'Updated' };
    await controller.update(validUuid, dto);
    expect(usersService.update).toHaveBeenCalledWith(validUuid, dto);
  });

  it('remove should call usersService.remove with UUID and current user ID', async () => {
    const currentUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    await controller.remove(validUuid, currentUser);

    expect(usersService.remove).toHaveBeenCalledWith(
      validUuid,
      'admin-id',
    );
  });
});
