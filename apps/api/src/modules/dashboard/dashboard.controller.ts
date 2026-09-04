import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RequiresFeature } from '../auth/decorators/requires-feature.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller({
  path: 'dashboard',
  version: '1',
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
    SubscriptionGuard,
  )
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @ApiOperation({
    summary: 'Get restaurant dashboard operational overview metrics',
  })
  async getOverview(
    @CurrentUser() user: any,
    @CurrentRestaurant() restaurant?: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRestaurantOverview(
      user,
      restaurant?.id,
      branch?.id,
      startDate,
      endDate,
    );
  }

  @Get('analytics')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
    SubscriptionGuard,
  )
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  @RequiresFeature('analytics')
  @ApiOperation({ summary: 'Get restaurant analytics metrics' })
  async getAnalytics(
    @CurrentUser() user: any,
    @CurrentRestaurant() restaurant?: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRestaurantAnalytics(
      user,
      restaurant?.id,
      branch?.id,
      startDate,
      endDate,
    );
  }

  @Get('platform-overview')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiOperation({ summary: 'Get global platform admin overview metrics' })
  async getPlatformOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getPlatformOverview(startDate, endDate);
  }
}
