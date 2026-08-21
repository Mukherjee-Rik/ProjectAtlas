import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicTablesService } from './public-tables.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('PublicTablesService', () => {
  let service: PublicTablesService;
  let prismaService: any;

  beforeEach(async () => {
    const tableMock = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    };
    prismaService = {
      table: tableMock,
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
    prismaService.table.findFirst.mockResolvedValue(null);
    prismaService.table.findUnique.mockResolvedValue(null);

    await expect(service.resolveTableToken('invalid-token')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolveTableToken should throw NotFoundException if table is INACTIVE', async () => {
    const tableData = {
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
    };
    prismaService.table.findFirst.mockResolvedValue(tableData);
    prismaService.table.findUnique.mockResolvedValue(tableData);

    await expect(service.resolveTableToken('token-inactive')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolveTableToken should return safe metadata when active', async () => {
    const tableData = {
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
    };
    prismaService.table.findFirst.mockResolvedValue(tableData);
    prismaService.table.findUnique.mockResolvedValue(tableData);

    const result = await service.resolveTableToken('valid-token');
    expect(result).toEqual({
      table: { id: 't-1', name: 'Table 4', code: 'T04', capacity: 4 },
      diningArea: { name: 'Indoor Dining' },
      branch: { name: 'Agartala Branch' },
      restaurant: { name: 'Pizza House' },
    });
  });

  it('getOrCreateSession should reuse existing active session', async () => {
    const tableData = {
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
    };
    prismaService.table.findFirst.mockResolvedValue(tableData);
    prismaService.table.findUnique.mockResolvedValue(tableData);

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
