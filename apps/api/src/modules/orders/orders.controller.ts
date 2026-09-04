import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateCancellationRequestDto } from './dto/cancellation-request.dto';
import { ReviewCancellationRequestDto } from './dto/review-cancellation-request.dto';
import { AddExtraChargeDto } from './dto/add-extra-charge.dto';
import {
  OrderStatus,
  CancellationRequestStatus,
} from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import {
  RESTAURANT_HEADER,
  TENANT_HEADER,
} from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ path: 'orders', version: '1' })
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('extra-charge')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async addExtraCharge(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentUser() user: any,
    @Body() dto: AddExtraChargeDto,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.addExtraCharge(
      restaurant.id,
      user,
      dto,
      branch?.id,
    );
  }

  @Get('cancellation-requests')
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findCancellationRequests(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('status') status?: CancellationRequestStatus,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.findCancellationRequests(
      restaurant.id,
      status,
      branch?.id,
    );
  }

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findAll(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.findRestaurantOrders(
      restaurant.id,
      branch?.id,
      status,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.findRestaurantOrderById(
      id,
      restaurant.id,
      branch?.id,
    );
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch: CurrentBranchType | undefined,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.updateOrderStatus(
      id,
      restaurant.id,
      dto,
      branch?.id,
    );
  }

  @Post(':id/cancel')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async cancelOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentUser() user: any,
    @Body() dto: CancelOrderDto,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.cancelOrder(
      id,
      restaurant.id,
      user,
      dto,
      branch?.id,
    );
  }

  @Post(':id/cancellation-request')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async createCancellationRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentUser() user: any,
    @Body() dto: CreateCancellationRequestDto,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.createCancellationRequest(
      id,
      restaurant.id,
      user,
      dto,
      branch?.id,
    );
  }

  @Post('cancellation-requests/:id/review')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async reviewCancellationRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentUser() user: any,
    @Body() dto: ReviewCancellationRequestDto,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.ordersService.reviewCancellationRequest(
      id,
      restaurant.id,
      user,
      dto,
    );
  }
}
