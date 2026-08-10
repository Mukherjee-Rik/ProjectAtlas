import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller({
  path: 'dashboard',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('overview')
  @Permissions(PERMISSIONS.DASHBOARD_READ)
  async getOverview() {
    return this.dashboardService.getOverview();
  }
}
