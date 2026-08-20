import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { KpiEngineService } from './services/kpi-engine.service';
import { TimeSeriesAnalyticsService } from './services/time-series-analytics.service';
import { RevenueAnalyticsService } from './services/revenue-analytics.service';
import { MenuProductAnalyticsService } from './services/menu-product-analytics.service';
import { CustomerCohortAnalyticsService } from './services/customer-cohort-analytics.service';
import { BranchStaffAnalyticsService } from './services/branch-staff-analytics.service';
import { OperationalDemandAnalyticsService } from './services/operational-demand-analytics.service';
import { DrillDownService } from './services/drill-down.service';
import { AnalyticsExportService } from './services/analytics-export.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  AnalyticsFilterDto,
  PeriodComparisonDto,
  DrillDownQueryDto,
  CreateSavedReportDto,
} from './dto/analytics-filter.dto';

@ApiTags('Advanced Analytics Engine')
@ApiBearerAuth('access-token')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(
  JwtAuthGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
  SubscriptionGuard,
)
export class AnalyticsController {
  constructor(
    private readonly kpiEngine: KpiEngineService,
    private readonly timeSeries: TimeSeriesAnalyticsService,
    private readonly revenueAnalytics: RevenueAnalyticsService,
    private readonly menuAnalytics: MenuProductAnalyticsService,
    private readonly cohortAnalytics: CustomerCohortAnalyticsService,
    private readonly branchStaffAnalytics: BranchStaffAnalyticsService,
    private readonly demandAnalytics: OperationalDemandAnalyticsService,
    private readonly drillDownService: DrillDownService,
    private readonly exportService: AnalyticsExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get standardized restaurant KPIs with period comparisons' })
  async getKpis(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: PeriodComparisonDto,
  ) {
    return this.kpiEngine.computeKpis(restaurantId, query);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get continuous time-series curves (Hourly, Daily, Monthly)' })
  async getTimeSeries(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto & { interval?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' },
  ) {
    return this.timeSeries.getTimeSeries(restaurantId, query, query.interval);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get detailed revenue breakdown, taxes, discounts, and payment channels' })
  async getRevenue(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto,
  ) {
    return this.revenueAnalytics.getRevenueBreakdown(restaurantId, query);
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get menu velocity and 2x2 profitability matrix' })
  async getMenuPerformance(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto,
  ) {
    return this.menuAnalytics.getMenuPerformance(restaurantId, query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer segmentation and monthly cohort retention matrices' })
  async getCustomers(@Headers('x-restaurant-id') restaurantId: string) {
    return this.cohortAnalytics.getCustomerAndCohortAnalytics(restaurantId);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get multi-branch comparative benchmarking' })
  async getBranches(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto,
  ) {
    return this.branchStaffAnalytics.getBranchComparison(restaurantId, query);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get normalized staff operational turnaround metrics' })
  async getStaff(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto,
  ) {
    return this.branchStaffAnalytics.getStaffOperationalAnalytics(restaurantId, query);
  }

  @Get('demand-matrix')
  @ApiOperation({ summary: 'Get 7x24 hour operational demand heatmap matrix' })
  async getDemandMatrix(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto,
  ) {
    return this.demandAnalytics.getOperationalDemandMatrix(restaurantId, query);
  }

  @Get('drilldown')
  @ApiOperation({ summary: 'Hierarchical transaction drill-down from aggregates to orders' })
  async drillDown(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: DrillDownQueryDto,
  ) {
    return this.drillDownService.drillDown(restaurantId, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export filtered analytics data as CSV' })
  async exportCsv(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: AnalyticsFilterDto & { type?: 'ORDERS' | 'MENU' },
    @Res() res: Response,
  ) {
    const csvData =
      query.type === 'MENU'
        ? await this.exportService.exportMenuCsv(restaurantId, query)
        : await this.exportService.exportOrdersCsv(restaurantId, query);

    const filename = `atlas_${query.type === 'MENU' ? 'menu' : 'orders'}_analytics_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List saved reports' })
  async getSavedReports(
    @Headers('x-restaurant-id') restaurantId: string,
    @Req() req: any,
  ) {
    return this.prisma.savedReport.findMany({
      where: {
        restaurantId,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('reports')
  @ApiOperation({ summary: 'Save custom report filter preset' })
  async saveReport(
    @Req() req: any,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Body() body: CreateSavedReportDto,
  ) {
    return this.prisma.savedReport.create({
      data: {
        tenantId: req.tenant?.id ?? tenantId,
        restaurantId: req.restaurant?.id ?? restaurantId,
        userId: req.user.id,
        name: body.name,
        description: body.description,
        reportType: body.reportType,
        filters: body.filters,
      },
    });
  }
}
