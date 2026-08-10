import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

const ITEM_SELECT = {
  id: true, categoryId: true, taxRateId: true, name: true, code: true, description: true,
  imageUrl: true, price: true, dietaryType: true, foodType: true, preparationTimeMinutes: true,
  position: true, status: true, createdAt: true, updatedAt: true,
};

const ITEM_SELECT_FULL = {
  ...ITEM_SELECT,
  category: { select: { id: true, name: true, code: true, menuId: true } },
  taxRate: { select: { id: true, name: true, type: true, value: true } },
  variantGroups: { orderBy: { position: 'asc' as const }, select: { id: true, menuItemId: true, name: true, required: true, position: true, variants: { orderBy: { position: 'asc' as const }, select: { id: true, groupId: true, name: true, price: true, position: true, status: true } } } },
  addonGroups: { orderBy: { position: 'asc' as const }, select: { id: true, menuItemId: true, name: true, required: true, minSelect: true, maxSelect: true, position: true, addons: { orderBy: { position: 'asc' as const }, select: { id: true, groupId: true, name: true, price: true, position: true, status: true } } } },
};

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, createDto: CreateMenuItemDto) {
    const { categoryId, name, code, description, imageUrl, price, dietaryType, foodType, preparationTimeMinutes, taxRateId, position, status } = createDto;

    const category = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, menu: { restaurantId } } });
    if (!category) throw new ForbiddenException('Category does not belong to your active restaurant');

    if (taxRateId) {
      const taxRate = await this.prisma.taxRate.findFirst({ where: { id: taxRateId, restaurantId } });
      if (!taxRate) throw new ForbiddenException('Tax rate does not belong to your active restaurant');
    }

    const existing = await this.prisma.menuItem.findUnique({ where: { categoryId_code: { categoryId, code } } });
    if (existing) throw new ConflictException('An item with this code already exists in this category');

    return this.prisma.menuItem.create({
      data: {
        categoryId, name, code, description, imageUrl, price,
        ...(dietaryType !== undefined && { dietaryType }),
        ...(foodType !== undefined && { foodType }),
        ...(preparationTimeMinutes !== undefined && { preparationTimeMinutes }),
        ...(taxRateId !== undefined && { taxRateId }),
        ...(position !== undefined && { position }),
        ...(status !== undefined && { status }),
      },
      select: ITEM_SELECT,
    });
  }

  async findAll(restaurantId: string, categoryId?: string) {
    return this.prisma.menuItem.findMany({
      where: { category: { menu: { restaurantId } }, ...(categoryId && { categoryId }) },
      select: { ...ITEM_SELECT, category: { select: { id: true, name: true, code: true } } },
      orderBy: { position: 'asc' },
    });
  }

  async findById(id: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, category: { menu: { restaurantId } } },
      select: ITEM_SELECT_FULL,
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(id: string, restaurantId: string, updateDto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findFirst({ where: { id, category: { menu: { restaurantId } } } });
    if (!existing) throw new ForbiddenException('Menu item not found or does not belong to active restaurant');

    const { categoryId, name, code, description, imageUrl, price, dietaryType, foodType, preparationTimeMinutes, taxRateId, position, status } = updateDto;
    const targetCategoryId = categoryId || existing.categoryId;

    if (categoryId && categoryId !== existing.categoryId) {
      const category = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, menu: { restaurantId } } });
      if (!category) throw new ForbiddenException('Target category does not belong to active restaurant');
    }

    if (taxRateId && taxRateId !== existing.taxRateId) {
      const taxRate = await this.prisma.taxRate.findFirst({ where: { id: taxRateId, restaurantId } });
      if (!taxRate) throw new ForbiddenException('Tax rate does not belong to your active restaurant');
    }

    if (code && (code !== existing.code || targetCategoryId !== existing.categoryId)) {
      const duplicate = await this.prisma.menuItem.findUnique({ where: { categoryId_code: { categoryId: targetCategoryId, code } } });
      if (duplicate) throw new ConflictException('Another item with this code already exists in this category');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(price !== undefined && { price }),
        ...(dietaryType !== undefined && { dietaryType }),
        ...(foodType !== undefined && { foodType }),
        ...(preparationTimeMinutes !== undefined && { preparationTimeMinutes }),
        ...(taxRateId !== undefined && { taxRateId }),
        ...(position !== undefined && { position }),
        ...(status !== undefined && { status }),
      },
      select: ITEM_SELECT,
    });
  }

  async remove(id: string, restaurantId: string) {
    const existing = await this.prisma.menuItem.findFirst({ where: { id, category: { menu: { restaurantId } } } });
    if (!existing) throw new ForbiddenException('Menu item not found or does not belong to active restaurant');
    return this.prisma.menuItem.delete({ where: { id }, select: { id: true, name: true, code: true } });
  }
}
