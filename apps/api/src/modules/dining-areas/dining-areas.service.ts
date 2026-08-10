import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateDiningAreaDto } from './dto/create-dining-area.dto';
import { UpdateDiningAreaDto } from './dto/update-dining-area.dto';

@Injectable()
export class DiningAreasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(branchId: string, createDto: CreateDiningAreaDto) {
    const { name, code, status } = createDto;

    const existing = await this.prisma.diningArea.findUnique({
      where: {
        branchId_code: {
          branchId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A dining area with this code already exists in this branch',
      );
    }

    return this.prisma.diningArea.create({
      data: {
        branchId,
        name,
        code,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        branchId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(branchId: string) {
    return this.prisma.diningArea.findMany({
      where: {
        branchId,
      },
      select: {
        id: true,
        branchId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tables: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findById(id: string, branchId: string) {
    const area = await this.prisma.diningArea.findFirst({
      where: {
        id,
        branchId,
      },
      select: {
        id: true,
        branchId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tables: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
            status: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Dining area not found');
    }

    return area;
  }

  async update(
    id: string,
    branchId: string,
    updateDto: UpdateDiningAreaDto,
  ) {
    const existing = await this.prisma.diningArea.findFirst({
      where: {
        id,
        branchId,
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Dining area not found or does not belong to active branch',
      );
    }

    const { name, code, status } = updateDto;

    if (code && code !== existing.code) {
      const duplicate = await this.prisma.diningArea.findUnique({
        where: {
          branchId_code: {
            branchId,
            code,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Another dining area with this code already exists in this branch',
        );
      }
    }

    return this.prisma.diningArea.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        branchId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, branchId: string) {
    const existing = await this.prisma.diningArea.findFirst({
      where: {
        id,
        branchId,
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Dining area not found or does not belong to active branch',
      );
    }

    return this.prisma.diningArea.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }
}
