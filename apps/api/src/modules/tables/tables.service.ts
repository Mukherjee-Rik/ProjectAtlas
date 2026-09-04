import crypto from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { SubscriptionUsageService } from '../subscriptions/subscription-usage.service';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionUsageService: SubscriptionUsageService,
  ) {}

  async create(branchId: string, createDto: CreateTableDto) {
    const { diningAreaId, name, code, capacity, status } = createDto;

    // Get branch to find restaurantId for limit checking
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { restaurantId: true },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Enforce active subscription table limit
    await this.subscriptionUsageService.checkLimit(
      branch.restaurantId,
      'maxTables',
    );

    // Security Verification: Dining Area must belong to active branchId
    const diningArea = await this.prisma.diningArea.findFirst({
      where: {
        id: diningAreaId,
        branchId,
      },
    });

    if (!diningArea) {
      throw new ForbiddenException(
        'Dining area does not belong to your active branch',
      );
    }

    const existingTable = await this.prisma.table.findUnique({
      where: {
        diningAreaId_code: {
          diningAreaId,
          code,
        },
      },
    });

    if (existingTable) {
      throw new ConflictException(
        'A table with this code already exists in this dining area',
      );
    }

    const publicToken = `tbl_${crypto.randomUUID().replace(/-/g, '')}`;

    return this.prisma.table.create({
      data: {
        diningAreaId,
        publicToken,
        name,
        code,
        capacity,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        diningAreaId: true,
        publicToken: true,
        name: true,
        code: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        diningArea: {
          select: {
            id: true,
            name: true,
            code: true,
            branchId: true,
          },
        },
      },
    });
  }

  async findAll(branchId: string, diningAreaId?: string) {
    return this.prisma.table.findMany({
      where: {
        diningArea: {
          branchId,
        },
        ...(diningAreaId && { diningAreaId }),
      },
      select: {
        id: true,
        diningAreaId: true,
        publicToken: true,
        name: true,
        code: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        diningArea: {
          select: {
            id: true,
            name: true,
            code: true,
            branchId: true,
          },
        },
        customerSessions: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            sessionToken: true,
            status: true,
            startedAt: true,
            orders: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                payments: {
                  select: {
                    id: true,
                    amount: true,
                    status: true,
                    method: true,
                    paidAt: true,
                    transactionReference: true,
                  },
                },
                cancellationRequests: {
                  select: {
                    id: true,
                    status: true,
                    reason: true,
                    note: true,
                  },
                },
                items: {
                  select: {
                    id: true,
                    name: true,
                    quantity: true,
                    unitPrice: true,
                    totalPrice: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findById(id: string, branchId: string) {
    const table = await this.prisma.table.findFirst({
      where: {
        id,
        diningArea: {
          branchId,
        },
      },
      select: {
        id: true,
        diningAreaId: true,
        publicToken: true,
        name: true,
        code: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        diningArea: {
          select: {
            id: true,
            name: true,
            code: true,
            branchId: true,
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async update(id: string, branchId: string, updateDto: UpdateTableDto) {
    const existingTable = await this.prisma.table.findFirst({
      where: {
        id,
        diningArea: {
          branchId,
        },
      },
    });

    if (!existingTable) {
      throw new ForbiddenException(
        'Table not found or does not belong to active branch',
      );
    }

    const { diningAreaId, name, code, capacity, status } = updateDto;

    const targetDiningAreaId = diningAreaId || existingTable.diningAreaId;

    if (diningAreaId && diningAreaId !== existingTable.diningAreaId) {
      const diningArea = await this.prisma.diningArea.findFirst({
        where: {
          id: diningAreaId,
          branchId,
        },
      });

      if (!diningArea) {
        throw new ForbiddenException(
          'Target dining area does not belong to active branch',
        );
      }
    }

    if (
      code &&
      (code !== existingTable.code ||
        targetDiningAreaId !== existingTable.diningAreaId)
    ) {
      const duplicate = await this.prisma.table.findUnique({
        where: {
          diningAreaId_code: {
            diningAreaId: targetDiningAreaId,
            code,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Another table with this code already exists in this dining area',
        );
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: {
        ...(diningAreaId !== undefined && { diningAreaId }),
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(capacity !== undefined && { capacity }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        diningAreaId: true,
        publicToken: true,
        name: true,
        code: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        diningArea: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async remove(id: string, branchId: string) {
    const existingTable = await this.prisma.table.findFirst({
      where: {
        id,
        diningArea: {
          branchId,
        },
      },
    });

    if (!existingTable) {
      throw new ForbiddenException(
        'Table not found or does not belong to active branch',
      );
    }

    return this.prisma.table.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  async getQrCode(
    id: string,
    branchId: string,
    baseUrl = 'http://localhost:4001',
  ) {
    const table = await this.prisma.table.findFirst({
      where: {
        id,
        diningArea: { branchId },
      },
      select: {
        id: true,
        name: true,
        code: true,
        publicToken: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const url = `${baseUrl}/t/${table.publicToken}`;
    const qrCodeSvg = await QRCode.toString(url, { type: 'svg' });

    return {
      tableId: table.id,
      tableName: table.name,
      publicToken: table.publicToken,
      url,
      qrCodeSvg,
    };
  }

  async regenerateQrCode(
    id: string,
    branchId: string,
    baseUrl = 'http://localhost:3001',
  ) {
    const table = await this.prisma.table.findFirst({
      where: {
        id,
        diningArea: { branchId },
      },
    });

    if (!table) {
      throw new ForbiddenException(
        'Table not found or does not belong to active branch',
      );
    }

    const newPublicToken = `tbl_${crypto.randomUUID().replace(/-/g, '')}`;

    const updatedTable = await this.prisma.table.update({
      where: { id },
      data: { publicToken: newPublicToken },
      select: {
        id: true,
        name: true,
        code: true,
        publicToken: true,
      },
    });

    const url = `${baseUrl}/t/${updatedTable.publicToken}`;
    const qrCodeSvg = await QRCode.toString(url, { type: 'svg' });

    return {
      tableId: updatedTable.id,
      tableName: updatedTable.name,
      publicToken: updatedTable.publicToken,
      url,
      qrCodeSvg,
    };
  }

  async clearTable(id: string, branchId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, diningArea: { branchId } },
    });

    if (!table) {
      throw new ForbiddenException(
        'Table not found or does not belong to active branch',
      );
    }

    await this.prisma.customerSession.updateMany({
      where: { tableId: id, status: 'ACTIVE' },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    return {
      success: true,
      message: `Table ${table.name} session ended and cleared.`,
    };
  }
}
