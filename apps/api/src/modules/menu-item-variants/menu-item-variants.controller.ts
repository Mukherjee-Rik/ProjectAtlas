import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { MenuItemVariantsService } from './menu-item-variants.service';
import { CreateVariantGroupDto } from './dto/create-variant-group.dto';
import { UpdateVariantGroupDto } from './dto/update-variant-group.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { RESTAURANT_HEADER, TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('Menu Item Variants')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard, RestaurantAccessGuard)
export class MenuItemVariantsController {
  constructor(private readonly service: MenuItemVariantsService) {}

  @Post('menu-items/:itemId/variant-groups') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_CREATE)
  async createGroup(@Param('itemId', new ParseUUIDPipe()) itemId: string, @CurrentRestaurant() r: CurrentRestaurantType, @Body() dto: CreateVariantGroupDto) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.createGroup(r.id, itemId, dto);
  }

  @Get('menu-items/:itemId/variant-groups') @Permissions(PERMISSIONS.MENU_ITEMS_READ)
  async findGroups(@Param('itemId', new ParseUUIDPipe()) itemId: string, @CurrentRestaurant() r: CurrentRestaurantType) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.findGroupsByItem(r.id, itemId);
  }

  @Patch('variant-groups/:id') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_UPDATE)
  async updateGroup(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() r: CurrentRestaurantType, @Body() dto: UpdateVariantGroupDto) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.updateGroup(r.id, id, dto);
  }

  @Delete('variant-groups/:id') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_DELETE)
  async removeGroup(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() r: CurrentRestaurantType) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.removeGroup(r.id, id);
  }

  @Post('variant-groups/:groupId/variants') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_CREATE)
  async createVariant(@Param('groupId', new ParseUUIDPipe()) groupId: string, @CurrentRestaurant() r: CurrentRestaurantType, @Body() dto: CreateVariantDto) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.createVariant(r.id, groupId, dto);
  }

  @Patch('variants/:id') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_UPDATE)
  async updateVariant(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() r: CurrentRestaurantType, @Body() dto: UpdateVariantDto) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.updateVariant(r.id, id, dto);
  }

  @Delete('variants/:id') @Permissions(PERMISSIONS.MENU_ITEM_VARIANTS_DELETE)
  async removeVariant(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() r: CurrentRestaurantType) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.removeVariant(r.id, id);
  }
}
