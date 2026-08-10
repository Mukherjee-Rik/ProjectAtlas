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

  it('findAll should call tenantsService.findAll', async () => {
    await controller.findAll();
    expect(tenantsService.findAll).toHaveBeenCalled();
  });
});
