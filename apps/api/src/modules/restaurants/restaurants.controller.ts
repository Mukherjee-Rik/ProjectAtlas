import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentTenant as CurrentTenantType } from '../auth/types/current-tenant.type';

@ApiTags('Restaurants')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: TENANT_HEADER,
  required: true,
  description: 'Current tenant organization ID',
})
@Controller({
  path: 'restaurants',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @Permissions(PERMISSIONS.RESTAURANTS_READ)
  async findAll(@CurrentTenant() tenant: CurrentTenantType) {
    return this.restaurantsService.findAll(tenant.id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.RESTAURANTS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenant: CurrentTenantType,
  ) {
    return this.restaurantsService.findById(id, tenant.id);
  }

  @Post()
  @Permissions(PERMISSIONS.RESTAURANTS_CREATE)
  async create(
    @CurrentTenant() tenant: CurrentTenantType,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ) {
    return this.restaurantsService.create(tenant.id, createRestaurantDto);
  }
}
