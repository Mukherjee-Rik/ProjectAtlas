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

import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { MenuCategoriesService } from './menu-categories.service';

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

@ApiTags('Menu Categories')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({
  path: 'menu-categories',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
export class MenuCategoriesController {
  constructor(private readonly categoriesService: MenuCategoriesService) {}

  @Post()
  @Permissions(PERMISSIONS.MENU_CATEGORIES_CREATE)
  async create(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() createDto: CreateMenuCategoryDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.categoriesService.create(restaurant.id, createDto);
  }

  @Get()
  @Permissions(PERMISSIONS.MENU_CATEGORIES_READ)
  @ApiQuery({ name: 'menuId', required: false, type: String })
  async findAll(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Query('menuId') menuId?: string,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.categoriesService.findAll(restaurant.id, menuId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.MENU_CATEGORIES_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.categoriesService.findById(id, restaurant.id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MENU_CATEGORIES_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() updateDto: UpdateMenuCategoryDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.categoriesService.update(id, restaurant.id, updateDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MENU_CATEGORIES_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.categoriesService.remove(id, restaurant.id);
  }
}
