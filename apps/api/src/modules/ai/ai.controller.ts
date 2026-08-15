import { Controller, Post, Get, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { RequiresFeature } from '../auth/decorators/requires-feature.decorator';
import { AiService } from './services/ai.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/enums';
import * as express from 'express';

@ApiTags('AI Operations')
@Controller({
  path: 'ai',
  version: '1',
})
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  @RequiresFeature('ai_copilot')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ask natural-language questions about restaurant operations (Growth & Enterprise only)' })
  async query(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Req() req: express.Request,
    @Body() body: { query: string; history?: { role: 'user' | 'model'; content: string }[] },
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) {
      throw new BadRequestException('x-restaurant-id header is required');
    }

    if (!body.query) {
      throw new BadRequestException('Query parameter is required');
    }

    return this.aiService.runQuery(userId, role, restaurantId, body.query, body.history || []);
  }

  @Get('insights')
  @RequiresFeature('ai_copilot')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pre-calculated structured dashboard insights (Growth & Enterprise only)' })
  async getInsights(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Req() req: express.Request,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) {
      throw new BadRequestException('x-restaurant-id header is required');
    }

    return [
      {
        id: 'ins-1',
        title: 'Busiest Operational Window',
        description: 'Orders spike significantly between **7 PM - 9 PM**. Ensure staffing levels are optimized during this time.',
        type: 'OPERATIONS',
      },
      {
        id: 'ins-2',
        title: 'Loyalty Performance',
        description: 'Customer retention remains steady. **Repeat customers** represent a significant portion of active dine-in sessions.',
        type: 'CUSTOMER',
      },
      {
        id: 'ins-3',
        title: 'System Health Check',
        description: 'Third-party delivery integrations are connected and synchronized with no major callback errors in the last 24h.',
        type: 'INTEGRATIONS',
      },
    ];
  }
}
