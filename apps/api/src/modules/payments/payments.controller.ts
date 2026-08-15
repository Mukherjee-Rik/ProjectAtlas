import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { RESTAURANT_HEADER, TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import { PaymentMethod } from '../../generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Dto for initiating a payment request
export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;
}

// Dto for mock webhook trigger
export class MockWebhookDto {
  @IsString()
  @IsNotEmpty()
  status: 'SUCCESS' | 'FAILED';

  @IsString()
  @IsOptional()
  transactionReference?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;
}

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 1. Authenticated endpoint to initiate a payment
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: TENANT_HEADER, required: true })
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard, RestaurantAccessGuard)
  @Post('initiate')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async initiate(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Headers(TENANT_HEADER) tenantId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.paymentsService.initiatePayment({
      tenantId,
      restaurantId: restaurant.id,
      orderId: dto.orderId,
      amount: dto.amount,
      method: dto.method,
    });
  }

  // 2. Authenticated endpoint to list restaurant payments
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: TENANT_HEADER, required: true })
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard, RestaurantAccessGuard)
  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  async findAll(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) throw new BadRequestException('No active restaurant selected');
    return this.paymentsService.findAll(restaurant.id);
  }

  // 3. Webhook listener for Stripe/Razorpay (Public / No Auth guard)
  @Post('webhook/:id')
  async handleWebhook(
    @Param('id') paymentId: string,
    @Body() payload: MockWebhookDto,
  ) {
    if (payload.status === 'SUCCESS') {
      return this.paymentsService.settlePayment(paymentId, payload.transactionReference);
    } else {
      return this.paymentsService.failPayment(paymentId, payload.failureReason ?? 'Transaction declined');
    }
  }
}
