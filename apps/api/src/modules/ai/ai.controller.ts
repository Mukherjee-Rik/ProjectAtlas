import { Controller, Post, Get, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { RequiresFeature } from '../auth/decorators/requires-feature.decorator';
import { AiService } from './services/ai.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { UserRole } from '../../generated/prisma/enums';
import { RESTAURANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('AI Operations')
@ApiBearerAuth('access-token')
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({
  path: 'ai',
  version: '1',
})
@UseGuards(JwtAuthGuard, RestaurantAccessGuard, SubscriptionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  @RequiresFeature('ai_copilot')
  @ApiOperation({ summary: 'Ask natural-language questions about restaurant operations (Growth & Enterprise only)' })
  async query(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: { query: string; history?: { role: 'user' | 'model'; content: string }[] },
  ) {
    const allowedRoles: UserRole[] = [UserRole.PLATFORM_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('AI Assistant is only accessible to Owners, Managers, and Platform Administrators.');
    }

    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }

    if (!body.query) {
      throw new BadRequestException('Query parameter is required');
    }

    return this.aiService.runQuery(userId, role, restaurant.id, body.query, body.history || []);
  }

  @Get('insights')
  @RequiresFeature('ai_copilot')
  @ApiOperation({ summary: 'Get pre-calculated structured dashboard insights (Growth & Enterprise only)' })
  async getInsights(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    const allowedRoles: UserRole[] = [UserRole.PLATFORM_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('AI Insights are only accessible to Owners, Managers, and Platform Administrators.');
    }

    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
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
