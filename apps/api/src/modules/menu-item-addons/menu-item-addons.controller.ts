import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { MenuItemAddonsService } from './menu-item-addons.service';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import {
  RESTAURANT_HEADER,
  TENANT_HEADER,
} from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('Menu Item Addons')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ version: '1' })
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
export class MenuItemAddonsController {
  constructor(private readonly service: MenuItemAddonsService) {}

  @Post('menu-items/:itemId/addon-groups')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_CREATE)
  async createGroup(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
    @Body() dto: CreateAddonGroupDto,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.createGroup(r.id, itemId, dto);
  }

  @Get('menu-items/:itemId/addon-groups')
  @Permissions(PERMISSIONS.MENU_ITEMS_READ)
  async findGroups(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.findGroupsByItem(r.id, itemId);
  }

  @Patch('addon-groups/:id')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_UPDATE)
  async updateGroup(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
    @Body() dto: UpdateAddonGroupDto,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.updateGroup(r.id, id, dto);
  }

  @Delete('addon-groups/:id')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_DELETE)
  async removeGroup(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.removeGroup(r.id, id);
  }

  @Post('addon-groups/:groupId/addons')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_CREATE)
  async createAddon(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
    @Body() dto: CreateAddonDto,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.createAddon(r.id, groupId, dto);
  }

  @Patch('addons/:id')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_UPDATE)
  async updateAddon(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
    @Body() dto: UpdateAddonDto,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.updateAddon(r.id, id, dto);
  }

  @Delete('addons/:id')
  @Permissions(PERMISSIONS.MENU_ITEM_ADDONS_DELETE)
  async removeAddon(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() r: CurrentRestaurantType,
  ) {
    if (!r) throw new BadRequestException('No active restaurant selected');
    return this.service.removeAddon(r.id, id);
  }
}
