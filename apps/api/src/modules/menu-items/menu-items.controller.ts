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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemsService } from './menu-items.service';

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

@ApiTags('Menu Items')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({
  path: 'menu-items',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
export class MenuItemsController {
  constructor(private readonly itemsService: MenuItemsService) {}

  @Post()
  @Permissions(PERMISSIONS.MENU_ITEMS_CREATE)
  async create(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() createDto: CreateMenuItemDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.itemsService.create(restaurant.id, createDto);
  }

  @Get()
  @Permissions(PERMISSIONS.MENU_ITEMS_READ)
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async findAll(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Query('categoryId') categoryId?: string,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.itemsService.findAll(restaurant.id, categoryId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.MENU_ITEMS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.itemsService.findById(id, restaurant.id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MENU_ITEMS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() updateDto: UpdateMenuItemDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.itemsService.update(id, restaurant.id, updateDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MENU_ITEMS_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.itemsService.remove(id, restaurant.id);
  }
}
