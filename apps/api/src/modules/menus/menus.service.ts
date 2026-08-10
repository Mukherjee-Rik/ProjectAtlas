import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, createDto: CreateMenuDto) {
    const { name, code, status } = createDto;

    const existing = await this.prisma.menu.findUnique({
      where: {
        restaurantId_code: {
          restaurantId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A menu with this code already exists in this restaurant',
      );
    }

    return this.prisma.menu.create({
      data: {
        restaurantId,
        name,
        code,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.menu.findMany({
      where: {
        restaurantId,
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            categories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findById(id: string, restaurantId: string) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        id,
        restaurantId,
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          orderBy: {
            position: 'asc',
          },
          select: {
            id: true,
            menuId: true,
            name: true,
            code: true,
            position: true,
            status: true,
            items: {
              orderBy: {
                position: 'asc',
              },
              select: {
                id: true,
                categoryId: true,
                name: true,
                code: true,
                description: true,
                price: true,
                position: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async update(id: string, restaurantId: string, updateDto: UpdateMenuDto) {
    const existing = await this.prisma.menu.findFirst({
      where: {
        id,
        restaurantId,
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Menu not found or does not belong to active restaurant',
      );
    }

    const { name, code, status } = updateDto;

    if (code && code !== existing.code) {
      const duplicate = await this.prisma.menu.findUnique({
        where: {
          restaurantId_code: {
            restaurantId,
            code,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Another menu with this code already exists in this restaurant',
        );
      }
    }

    return this.prisma.menu.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const existing = await this.prisma.menu.findFirst({
      where: {
        id,
        restaurantId,
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Menu not found or does not belong to active restaurant',
      );
    }

    return this.prisma.menu.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }
}
