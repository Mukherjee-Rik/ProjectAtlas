import { Controller, Post, Get, Body, Param, Headers, UseGuards, HttpStatus, HttpCode, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeliveryService } from '../services/delivery.service';
import * as express from 'express';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Save delivery provider integration configuration' })
  async saveConfig(
    @Req() req: express.Request,
    @Body() body: { provider: string; enabled: boolean; credentials: any },
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) {
      throw new BadRequestException('x-restaurant-id header is required');
    }
    return this.deliveryService.saveProviderConfig(
      restaurantId,
      body.provider,
      body.enabled,
      body.credentials,
    );
  }

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get configured delivery integrations for restaurant' })
  async getConfig(@Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) {
      throw new BadRequestException('x-restaurant-id header is required');
    }
    return this.deliveryService.getProviderConfigs(restaurantId);
  }

  @Get('health/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get adapter health and connectivity' })
  async getHealth(
    @Req() req: express.Request,
    @Param('provider') provider: string,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) {
      throw new BadRequestException('x-restaurant-id header is required');
    }
    const isHealthy = await this.deliveryService.getProviderHealth(restaurantId, provider);
    return { provider, status: isHealthy ? 'HEALTHY' : 'UNHEALTHY' };
  }
}

// Simple request helper exceptions
import { BadRequestException } from '@nestjs/common';
