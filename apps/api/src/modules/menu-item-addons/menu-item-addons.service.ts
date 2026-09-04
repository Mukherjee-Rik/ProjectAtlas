import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Injectable()
export class MenuItemAddonsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyItemOwnership(menuItemId: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, category: { menu: { restaurantId } } },
    });
    if (!item)
      throw new ForbiddenException(
        'Menu item does not belong to your active restaurant',
      );
  }

  private async verifyGroupOwnership(groupId: string, restaurantId: string) {
    const group = await this.prisma.menuItemAddonGroup.findFirst({
      where: {
        id: groupId,
        menuItem: { category: { menu: { restaurantId } } },
      },
    });
    if (!group)
      throw new ForbiddenException(
        'Addon group does not belong to your active restaurant',
      );
  }

  private async verifyAddonOwnership(addonId: string, restaurantId: string) {
    const addon = await this.prisma.menuItemAddon.findFirst({
      where: {
        id: addonId,
        group: { menuItem: { category: { menu: { restaurantId } } } },
      },
    });
    if (!addon)
      throw new ForbiddenException(
        'Addon does not belong to your active restaurant',
      );
  }

  async createGroup(
    restaurantId: string,
    menuItemId: string,
    dto: CreateAddonGroupDto,
  ) {
    await this.verifyItemOwnership(menuItemId, restaurantId);
    return this.prisma.menuItemAddonGroup.create({
      data: {
        menuItemId,
        name: dto.name,
        ...(dto.required !== undefined && { required: dto.required }),
        ...(dto.minSelect !== undefined && { minSelect: dto.minSelect }),
        ...(dto.maxSelect !== undefined && { maxSelect: dto.maxSelect }),
        ...(dto.position !== undefined && { position: dto.position }),
      },
      select: {
        id: true,
        menuItemId: true,
        name: true,
        required: true,
        minSelect: true,
        maxSelect: true,
        position: true,
        addons: {
          select: {
            id: true,
            name: true,
            price: true,
            position: true,
            status: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async findGroupsByItem(restaurantId: string, menuItemId: string) {
    await this.verifyItemOwnership(menuItemId, restaurantId);
    return this.prisma.menuItemAddonGroup.findMany({
      where: { menuItemId },
      select: {
        id: true,
        menuItemId: true,
        name: true,
        required: true,
        minSelect: true,
        maxSelect: true,
        position: true,
        addons: {
          select: {
            id: true,
            name: true,
            price: true,
            position: true,
            status: true,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateGroup(
    restaurantId: string,
    groupId: string,
    dto: UpdateAddonGroupDto,
  ) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemAddonGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.required !== undefined && { required: dto.required }),
        ...(dto.minSelect !== undefined && { minSelect: dto.minSelect }),
        ...(dto.maxSelect !== undefined && { maxSelect: dto.maxSelect }),
        ...(dto.position !== undefined && { position: dto.position }),
      },
      select: {
        id: true,
        menuItemId: true,
        name: true,
        required: true,
        minSelect: true,
        maxSelect: true,
        position: true,
      },
    });
  }

  async removeGroup(restaurantId: string, groupId: string) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemAddonGroup.delete({
      where: { id: groupId },
      select: { id: true, name: true },
    });
  }

  async createAddon(
    restaurantId: string,
    groupId: string,
    dto: CreateAddonDto,
  ) {
    await this.verifyGroupOwnership(groupId, restaurantId);
    return this.prisma.menuItemAddon.create({
      data: {
        groupId,
        name: dto.name,
        price: dto.price,
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        groupId: true,
        name: true,
        price: true,
        position: true,
        status: true,
      },
    });
  }

  async updateAddon(
    restaurantId: string,
    addonId: string,
    dto: UpdateAddonDto,
  ) {
    await this.verifyAddonOwnership(addonId, restaurantId);
    return this.prisma.menuItemAddon.update({
      where: { id: addonId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        groupId: true,
        name: true,
        price: true,
        position: true,
        status: true,
      },
    });
  }

  async removeAddon(restaurantId: string, addonId: string) {
    await this.verifyAddonOwnership(addonId, restaurantId);
    return this.prisma.menuItemAddon.delete({
      where: { id: addonId },
      select: { id: true, name: true },
    });
  }
}
