import { Controller, Post, Get, Body, Param, Headers, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RestaurantAccessGuard } from '../../auth/guards/restaurant-access.guard';
import { CurrentRestaurant } from '../../auth/decorators/current-restaurant.decorator';
import { DeliveryService } from '../services/delivery.service';
import { RESTAURANT_HEADER } from '../../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../../auth/types/current-restaurant.type';

@ApiTags('Delivery Integration')
@Controller({
  path: 'delivery',
  version: '1',
})
export class DeliveryWebhookController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive callbacks from external delivery platforms (Zomato/Swiggy)' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.deliveryService.handleWebhook(provider, signature, payload);
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @ApiOperation({ summary: 'Save delivery provider integration configuration' })
  async saveConfig(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: { provider: string; enabled: boolean; credentials: any },
  ) {
    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }
    return this.deliveryService.saveProviderConfig(
      restaurant.id,
      body.provider,
      body.enabled,
      body.credentials,
    );
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @ApiOperation({ summary: 'Get configured delivery integrations for restaurant' })
  async getConfig(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }
    return this.deliveryService.getProviderConfigs(restaurant.id);
  }

  @Get('health/:provider')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @ApiOperation({ summary: 'Get adapter health and connectivity' })
  async getHealth(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Param('provider') provider: string,
  ) {
    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }
    const isHealthy = await this.deliveryService.getProviderHealth(restaurant.id, provider);
    return { provider, status: isHealthy ? 'HEALTHY' : 'UNHEALTHY' };
  }
}
