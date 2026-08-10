import { Test, TestingModule } from '@nestjs/testing';
import { TenantMembershipsController } from './tenant-memberships.controller';
import { TenantMembershipsService } from './tenant-memberships.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('TenantMembershipsController', () => {
  let controller: TenantMembershipsController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn().mockResolvedValue([]),
      findByTenant: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantMembershipsController],
      providers: [
        { provide: TenantMembershipsService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TenantMembershipsController>(
      TenantMembershipsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findByUser should delegate to service.findByUser', async () => {
    await controller.findByUser('u-1');
    expect(service.findByUser).toHaveBeenCalledWith('u-1');
  });

  it('findByTenant should delegate to service.findByTenant', async () => {
    await controller.findByTenant('t-1');
    expect(service.findByTenant).toHaveBeenCalledWith('t-1');
  });
});
