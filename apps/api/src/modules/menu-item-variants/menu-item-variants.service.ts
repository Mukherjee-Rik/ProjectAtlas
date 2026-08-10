import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateVariantGroupDto } from './dto/create-variant-group.dto';
import { UpdateVariantGroupDto } from './dto/update-variant-group.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class MenuItemVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyItemOwnership(menuItemId: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: menuItemId, category: { menu: { restaurantId } } } });
    if (!item) throw new ForbiddenException('Menu item does not belong to your active restaurant');
    return item;
  }

  private async verifyGroupOwnership(groupId: string, restaurantId: string) {
    const group = await this.prisma.menuItemVariantGroup.findFirst({ where: { id: groupId, menuItem: { category: { menu: { restaurantId } } } } });
    if (!group) throw new ForbiddenException('Variant group does not belong to your active restaurant');
    return group;
  }

  private async verifyVariantOwnership(variantId: string, restaurantId: string) {
    const variant = await this.prisma.menuItemVariant.findFirst({ where: { id: variantId, group: { menuItem: { category: { menu: { restaurantId } } } } } });
    if (!variant) throw new ForbiddenException('Variant does not belong to your active restaurant');
    return variant;
  }

  async createGroup(restaurantId: string, menuItemId: string, dto: CreateVariantGroupDto) {
    await this.verifyItemOwnership(menuItemId, restaurantId);
    return this.prisma.menuItemVariantGroup.create({
      data: { menuItemId, name: dto.name, ...(dto.required !== undefined && { required: dto.required }), ...(dto.position !== undefined && { position: dto.position }) },
      select: { id: true, menuItemId: true, name: true, required: true, position: true, variants: { select: { id: true, name: true, price: true, position: true, status: true }, orderBy: { position: 'asc' } } },
    });
  }

  async findGroupsByItem(restaurantId: string, menuItemId: string) {
    await this.verifyItemOwnership(menuItemId, restaurantId);
    return this.prisma.menuItemVariantGroup.findMany({
      where: { menuItemId },
      select: { id: true, menuItemId: true, name: true, required: true, position: true, variants: { select: { id: true, name: true, price: true, position: true, status: true }, orderBy: { position: 'asc' } } },
      orderBy: { position: 'asc' },
    });
  }

  async updateGroup(restaurantId: string, groupId: string, dto: UpdateVariantGroupDto) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemVariantGroup.update({
      where: { id: groupId },
      data: { ...(dto.name !== undefined && { name: dto.name }), ...(dto.required !== undefined && { required: dto.required }), ...(dto.position !== undefined && { position: dto.position }) },
      select: { id: true, menuItemId: true, name: true, required: true, position: true },
    });
  }

  async removeGroup(restaurantId: string, groupId: string) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemVariantGroup.delete({ where: { id: groupId }, select: { id: true, name: true } });
  }

  async createVariant(restaurantId: string, groupId: string, dto: CreateVariantDto) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemVariant.create({
      data: { groupId, name: dto.name, price: dto.price, ...(dto.position !== undefined && { position: dto.position }), ...(dto.status !== undefined && { status: dto.status }) },
      select: { id: true, groupId: true, name: true, price: true, position: true, status: true },
    });
  }

  async updateVariant(restaurantId: string, variantId: string, dto: UpdateVariantDto) {
    await this.verifyVariantOwnership(variantId, restaurantId);
    return this.prisma.menuItemVariant.update({
      where: { id: variantId },
      data: { ...(dto.name !== undefined && { name: dto.name }), ...(dto.price !== undefined && { price: dto.price }), ...(dto.position !== undefined && { position: dto.position }), ...(dto.status !== undefined && { status: dto.status }) },
      select: { id: true, groupId: true, name: true, price: true, position: true, status: true },
    });
  }

  async removeVariant(restaurantId: string, variantId: string) {
    await this.verifyVariantOwnership(variantId, restaurantId);
    return this.prisma.menuItemVariant.delete({ where: { id: variantId }, select: { id: true, name: true } });
  }
}
