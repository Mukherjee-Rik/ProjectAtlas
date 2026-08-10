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

import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenusService } from './menus.service';

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

@ApiTags('Menus')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({
  path: 'menus',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @Permissions(PERMISSIONS.MENUS_CREATE)
  async create(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() createDto: CreateMenuDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.menusService.create(restaurant.id, createDto);
  }

  @Get()
  @Permissions(PERMISSIONS.MENUS_READ)
  async findAll(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.menusService.findAll(restaurant.id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.MENUS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.menusService.findById(id, restaurant.id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() updateDto: UpdateMenuDto,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.menusService.update(id, restaurant.id, updateDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MENUS_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException('No active restaurant selected');
    }
    return this.menusService.remove(id, restaurant.id);
  }
}
