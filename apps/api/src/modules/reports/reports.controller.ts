import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { ReportService } from './services/report.service';
import { ReportTemplateService } from './services/report-template.service';
import { ReportSchedulerService } from './services/report-scheduler.service';
import { ReportExportService } from './services/report-export.service';
import {
  CreateCustomReportDto,
  UpdateCustomReportDto,
  CreateReportScheduleDto,
  ReportConfigurationDto,
} from './dto/custom-report.dto';

@ApiTags('Custom Reports & Report Builder')
@ApiBearerAuth('access-token')
@Controller({ path: 'reports', version: '1' })
@UseGuards(
  JwtAuthGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
  SubscriptionGuard,
)
export class ReportsController {
  constructor(
    private readonly reportService: ReportService,
    private readonly templateService: ReportTemplateService,
    private readonly schedulerService: ReportSchedulerService,
    private readonly exportService: ReportExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List custom reports for restaurant' })
  async listReports(
    @Headers('x-restaurant-id') restaurantId: string,
    @Req() req: any,
  ) {
    return this.reportService.listReports(restaurantId, req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List prebuilt standard report templates' })
  listTemplates() {
    return this.templateService.listTemplates();
  }

  @Post('templates/:templateId/use')
  @ApiOperation({ summary: 'Instantiate custom report from a template' })
  async useTemplate(
    @Param('templateId') templateId: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: any,
    @Body('name') customName?: string,
  ) {
    return this.templateService.useTemplate(
      templateId,
      restaurantId,
      tenantId,
      req.user.id,
      customName,
    );
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview report output before saving' })
  async previewReport(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      name: string;
      dataSource: string;
      configuration: ReportConfigurationDto;
    },
  ) {
    return this.reportService.previewReport(
      restaurantId,
      body.name || 'Preview Report',
      body.dataSource,
      body.configuration,
      branchId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create new custom report' })
  async createReport(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: any,
    @Body() dto: CreateCustomReportDto,
  ) {
    return this.reportService.createReport(
      restaurantId,
      tenantId,
      req.user.id,
      dto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report definition by ID' })
  async getReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
  ) {
    return this.reportService.getReportById(id, restaurantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update existing report definition' })
  async updateReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Body() dto: UpdateCustomReportDto,
  ) {
    return this.reportService.updateReport(id, restaurantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report definition' })
  async deleteReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
  ) {
    return this.reportService.deleteReport(id, restaurantId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing report' })
  async duplicateReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: any,
  ) {
    return this.reportService.duplicateReport(
      id,
      restaurantId,
      req.user.id,
      tenantId,
    );
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Execute and generate report dataset' })
  async runReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Req() req: any,
  ) {
    return this.reportService.runReport(
      id,
      restaurantId,
      req.user.id,
      branchId,
    );
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export report dataset as CSV' })
  async exportReport(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const result = await this.reportService.runReport(
      id,
      restaurantId,
      req.user.id,
      branchId,
    );
    const csvContent = this.exportService.generateCsv(result);
    const filename = `${result.reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }

  // Schedules Sub-endpoints
  @Get(':id/schedules')
  @ApiOperation({ summary: 'List schedules for a report' })
  async listSchedules(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
  ) {
    return this.schedulerService.listSchedules(restaurantId, id);
  }

  @Post(':id/schedules')
  @ApiOperation({ summary: 'Create automated recurring schedule for report' })
  async createSchedule(
    @Param('id') id: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateReportScheduleDto,
  ) {
    return this.schedulerService.createSchedule(
      id,
      restaurantId,
      tenantId,
      dto,
    );
  }

  @Delete('schedules/:scheduleId')
  @ApiOperation({ summary: 'Delete report schedule' })
  async deleteSchedule(
    @Param('scheduleId') scheduleId: string,
    @Headers('x-restaurant-id') restaurantId: string,
  ) {
    return this.schedulerService.deleteSchedule(scheduleId, restaurantId);
  }
}
