import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { TaxRatesService } from './tax-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { RESTAURANT_HEADER, TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('Tax Rates')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ path: 'tax-rates', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard, RestaurantAccessGuard)
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  @Post() @Permissions(PERMISSIONS.TAX_RATES_CREATE)
  async create(@CurrentRestaurant() restaurant: CurrentRestaurantType, @Body() dto: CreateTaxRateDto) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.taxRatesService.create(restaurant.id, dto);
  }

  @Get() @Permissions(PERMISSIONS.TAX_RATES_READ)
  async findAll(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.taxRatesService.findAll(restaurant.id);
  }

  @Get(':id') @Permissions(PERMISSIONS.TAX_RATES_READ)
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.taxRatesService.findById(id, restaurant.id);
  }

  @Patch(':id') @Permissions(PERMISSIONS.TAX_RATES_UPDATE)
  async update(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType, @Body() dto: UpdateTaxRateDto) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.taxRatesService.update(id, restaurant.id, dto);
  }

  @Delete(':id') @Permissions(PERMISSIONS.TAX_RATES_DELETE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.taxRatesService.remove(id, restaurant.id);
  }
}
