import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicTablesService } from './public-tables.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('PublicTablesService', () => {
  let service: PublicTablesService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      table: {
        findUnique: jest.fn(),
      },
      customerSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicTablesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<PublicTablesService>(PublicTablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resolveTableToken should throw NotFoundException if table not found', async () => {
    prismaService.table.findUnique.mockResolvedValue(null);

    await expect(service.resolveTableToken('invalid-token')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolveTableToken should throw NotFoundException if table is INACTIVE', async () => {
    prismaService.table.findUnique.mockResolvedValue({
      id: 't-1',
      status: 'INACTIVE',
      diningArea: {
        status: 'ACTIVE',
        branch: {
          status: 'ACTIVE',
          restaurant: {
            status: 'ACTIVE',
            tenant: { status: 'ACTIVE' },
          },
        },
      },
    });

    await expect(service.resolveTableToken('token-inactive')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolveTableToken should return safe metadata when active', async () => {
    prismaService.table.findUnique.mockResolvedValue({
      id: 't-1',
      name: 'Table 4',
      code: 'T04',
      capacity: 4,
      status: 'ACTIVE',
      diningArea: {
        name: 'Indoor Dining',
        status: 'ACTIVE',
        branch: {
          name: 'Agartala Branch',
          status: 'ACTIVE',
          restaurant: {
            name: 'Pizza House',
            status: 'ACTIVE',
            tenant: { name: 'Mukherjee Foods', status: 'ACTIVE' },
          },
        },
      },
    });

    const result = await service.resolveTableToken('valid-token');
    expect(result).toEqual({
      table: { id: 't-1', name: 'Table 4', code: 'T04', capacity: 4 },
      diningArea: { name: 'Indoor Dining' },
      branch: { name: 'Agartala Branch' },
      restaurant: { name: 'Pizza House' },
    });
  });

  it('getOrCreateSession should reuse existing active session', async () => {
    prismaService.table.findUnique.mockResolvedValue({
      id: 't-1',
      name: 'Table 4',
      code: 'T04',
      capacity: 4,
      status: 'ACTIVE',
      diningArea: {
        name: 'Indoor Dining',
        status: 'ACTIVE',
        branch: {
          name: 'Agartala Branch',
          status: 'ACTIVE',
          restaurant: {
            name: 'Pizza House',
            status: 'ACTIVE',
            tenant: { name: 'Mukherjee Foods', status: 'ACTIVE' },
          },
        },
      },
    });

    prismaService.customerSession.findFirst.mockResolvedValue({
      id: 'cs-1',
      sessionToken: 'cs_existing123',
      status: 'ACTIVE',
      startedAt: new Date(),
    });

    const result = await service.getOrCreateSession('valid-token');
    expect(result.sessionToken).toBe('cs_existing123');
    expect(prismaService.customerSession.create).not.toHaveBeenCalled();
  });
});
