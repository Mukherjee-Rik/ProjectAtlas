import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionUsageService } from './subscription-usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller({
  path: 'subscriptions',
  version: '1',
})
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionUsageService: SubscriptionUsageService,
  ) {}

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Get()
  async findAll() {
    return this.subscriptionsService.findAllSubscriptions();
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post('assign')
  async assign(@Body() body: { restaurantId: string; planId: string }) {
    if (!body.restaurantId || !body.planId) {
      throw new BadRequestException('restaurantId and planId are required');
    }
    return this.subscriptionsService.assignSubscription(
      body.restaurantId,
      body.planId,
    );
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post(':id/extend-trial')
  async extendTrial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { extensionDays: number },
  ) {
    if (body.extensionDays === undefined) {
      throw new BadRequestException('extensionDays is required');
    }
    return this.subscriptionsService.extendTrial(id, body.extensionDays);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body: {
      status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED';
    },
  ) {
    if (!body.status) {
      throw new BadRequestException('status is required');
    }
    return this.subscriptionsService.updateStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @Get('my-subscription')
  async getMySubscription(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant) {
      throw new BadRequestException(
        'Restaurant context is required. Send x-restaurant-id header.',
      );
    }
    return this.subscriptionsService.getRestaurantSubscription(restaurant.id);
  }

  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @Get('usage')
  async getMyUsage(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant) {
      throw new BadRequestException(
        'Restaurant context is required. Send x-restaurant-id header.',
      );
    }
    return this.subscriptionUsageService.getUsageStats(restaurant.id);
  }

  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @Post('upgrade')
  async selfUpgrade(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: { planId: string },
  ) {
    if (!restaurant) {
      throw new BadRequestException(
        'Restaurant context is required. Send x-restaurant-id header.',
      );
    }
    if (!body.planId) {
      throw new BadRequestException('planId is required');
    }

    const subscription = await this.subscriptionsService.assignSubscription(
      restaurant.id,
      body.planId,
    );

    return {
      subscription,
      paymentInfo: {
        amountPaid: Number(subscription.plan.price),
        currency: subscription.plan.currency || 'INR',
        transactionReference: `TXN_SUB_${Date.now().toString(36).toUpperCase()}`,
        status: 'SUCCESS',
        message: `Successfully processed payment of ${subscription.plan.currency || 'INR'} ${subscription.plan.price} and updated subscription to ${subscription.plan.name}!`,
        paidAt: new Date().toISOString(),
      },
    };
  }

  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @Post('cancel')
  async selfCancel(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body?: { reason?: string },
  ) {
    if (!restaurant) {
      throw new BadRequestException(
        'Restaurant context is required. Send x-restaurant-id header.',
      );
    }
    return this.subscriptionsService.cancelRestaurantSubscription(
      restaurant.id,
      body?.reason,
    );
  }
}
