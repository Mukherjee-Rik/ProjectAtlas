import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

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
});
