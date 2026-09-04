import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: any;

  beforeEach(async () => {
    tenantsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findAllForUser: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: tenantsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should scope the listing to the calling user', async () => {
    await controller.findAll({
      id: 'u-1',
      email: 'owner@example.com',
      role: 'OWNER',
    });

    // Must never call the unscoped listing for a normal user — that returned
    // every tenant on the platform.
    expect(tenantsService.findAllForUser).toHaveBeenCalledWith('u-1', 'OWNER');
    expect(tenantsService.findAll).not.toHaveBeenCalled();
  });

  it('findAll should pass a platform admin role through for global visibility', async () => {
    await controller.findAll({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
    });

    expect(tenantsService.findAllForUser).toHaveBeenCalledWith(
      'admin-1',
      'PLATFORM_ADMIN',
    );
  });
});
