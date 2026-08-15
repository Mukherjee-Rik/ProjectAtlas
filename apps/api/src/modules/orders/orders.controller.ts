import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { RESTAURANT_HEADER, TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ path: 'orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard, RestaurantAccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findAll(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('status') status?: OrderStatus,
  ) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.ordersService.findRestaurantOrders(restaurant.id, branch?.id, status);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.ordersService.findRestaurantOrderById(id, restaurant.id, branch?.id);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch: CurrentBranchType | undefined,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.ordersService.updateOrderStatus(id, restaurant.id, dto, branch?.id);
  }
}
