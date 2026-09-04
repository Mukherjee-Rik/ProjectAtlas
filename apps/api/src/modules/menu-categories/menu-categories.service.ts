import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';

@Injectable()
export class MenuCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, createDto: CreateMenuCategoryDto) {
    const { menuId, name, code, position, status } = createDto;

    // Security Verification: Menu must belong to active restaurantId
    const menu = await this.prisma.menu.findFirst({
      where: {
        id: menuId,
        restaurantId,
      },
    });

    if (!menu) {
      throw new ForbiddenException(
        'Menu does not belong to your active restaurant',
      );
    }

    const existing = await this.prisma.menuCategory.findUnique({
      where: {
        menuId_code: {
          menuId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A category with this code already exists in this menu',
      );
    }

    return this.prisma.menuCategory.create({
      data: {
        menuId,
        name,
        code,
        ...(position !== undefined && { position }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        menuId: true,
        name: true,
        code: true,
        position: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(restaurantId: string, menuId?: string) {
    return this.prisma.menuCategory.findMany({
      where: {
        menu: {
          restaurantId,
        },
        ...(menuId && { menuId }),
      },
      select: {
        id: true,
        menuId: true,
        name: true,
        code: true,
        position: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findById(id: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id,
        menu: {
          restaurantId,
        },
      },
      select: {
        id: true,
        menuId: true,
        name: true,
        code: true,
        position: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          where: {
            status: 'ACTIVE',
          },
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
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    return category;
  }

  async update(
    id: string,
    restaurantId: string,
    updateDto: UpdateMenuCategoryDto,
  ) {
    const existing = await this.prisma.menuCategory.findFirst({
      where: {
        id,
        menu: {
          restaurantId,
        },
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Menu category not found or does not belong to active restaurant',
      );
    }

    const { menuId, name, code, position, status } = updateDto;
    const targetMenuId = menuId || existing.menuId;

    if (menuId && menuId !== existing.menuId) {
      const menu = await this.prisma.menu.findFirst({
        where: {
          id: menuId,
          restaurantId,
        },
      });

      if (!menu) {
        throw new ForbiddenException(
          'Target menu does not belong to active restaurant',
        );
      }
    }

    if (code && (code !== existing.code || targetMenuId !== existing.menuId)) {
      const duplicate = await this.prisma.menuCategory.findUnique({
        where: {
          menuId_code: {
            menuId: targetMenuId,
            code,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Another category with this code already exists in this menu',
        );
      }
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: {
        ...(menuId !== undefined && { menuId }),
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(position !== undefined && { position }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        menuId: true,
        name: true,
        code: true,
        position: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const existing = await this.prisma.menuCategory.findFirst({
      where: {
        id,
        menu: {
          restaurantId,
        },
      },
      include: {
        items: {
          include: {
            orderItems: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    if (!existing) {
      throw new ForbiddenException(
        'Menu category not found or does not belong to active restaurant',
      );
    }

    // Process all items in this category
    for (const item of existing.items) {
      await this.prisma.cartItem.deleteMany({ where: { menuItemId: item.id } });
      if (item.orderItems && item.orderItems.length > 0) {
        await this.prisma.menuItem.update({
          where: { id: item.id },
          data: {
            status: 'INACTIVE',
            code: `${item.code}_deleted_${Date.now()}`,
          },
        });
      } else {
        await this.prisma.menuItem.delete({ where: { id: item.id } });
      }
    }

    // If any historical items remain attached, mark category inactive
    const remainingItems = await this.prisma.menuItem.count({
      where: { categoryId: id },
    });
    if (remainingItems > 0) {
      await this.prisma.menuCategory.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          code: `${existing.code}_deleted_${Date.now()}`,
        },
      });
      return {
        id,
        name: existing.name,
        code: existing.code,
        status: 'INACTIVE',
        deleted: true,
      };
    }

    return this.prisma.menuCategory.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }
}
