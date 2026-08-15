import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RequiresFeature } from '../auth/decorators/requires-feature.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller({
  path: 'dashboard',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get restaurant dashboard operational overview metrics' })
  async getOverview(
    @Headers('x-restaurant-id') restaurantId?: string,
    @Headers('x-branch-id') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRestaurantOverview(restaurantId, branchId, startDate, endDate);
  }

  @Get('analytics')
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @RequiresFeature('analytics')
  @ApiOperation({ summary: 'Get restaurant analytics metrics' })
  async getAnalytics(
    @Headers('x-restaurant-id') restaurantId?: string,
    @Headers('x-branch-id') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRestaurantAnalytics(restaurantId, branchId, startDate, endDate);
  }

  @Get('platform-overview')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Get global platform admin overview metrics' })
  async getPlatformOverview() {
    return this.dashboardService.getPlatformOverview();
  }
}
