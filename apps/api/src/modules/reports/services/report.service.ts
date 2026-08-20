import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ReportExecutionEngineService, ReportExecutionResult } from './report-execution-engine.service';
import { ReportValidatorService } from './report-validator.service';
import { CreateCustomReportDto, UpdateCustomReportDto, ReportConfigurationDto } from '../dto/custom-report.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly executionEngine: ReportExecutionEngineService,
    private readonly validator: ReportValidatorService,
  ) {}

  async listReports(restaurantId: string, userId: string) {
    return this.prisma.customReport.findMany({
      where: {
        restaurantId,
        OR: [
          { visibility: 'RESTAURANT' },
          { createdById: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        schedules: { select: { id: true, name: true, frequency: true, enabled: true, nextRunAt: true } },
      },
    });
  }

  async getReportById(id: string, restaurantId: string) {
    const report = await this.prisma.customReport.findFirst({
      where: { id, restaurantId },
      include: {
        schedules: true,
        executions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!report) throw new NotFoundException('Report not found or does not belong to active restaurant');
    return report;
  }

  async createReport(restaurantId: string, tenantId: string, userId: string, dto: CreateCustomReportDto) {
    this.validator.validate(dto.dataSource, dto.configuration);

    return this.prisma.customReport.create({
      data: {
        tenantId,
        restaurantId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        dataSource: dto.dataSource,
        configuration: dto.configuration as any,
        visibility: dto.visibility || 'RESTAURANT',
        branchId: dto.branchId,
        version: 1,
      },
    });
  }

  async updateReport(id: string, restaurantId: string, dto: UpdateCustomReportDto) {
    const existing = await this.getReportById(id, restaurantId);

    if (dto.configuration) {
      this.validator.validate(existing.dataSource, dto.configuration);
    }

    return this.prisma.customReport.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        configuration: (dto.configuration as any) ?? existing.configuration,
        visibility: dto.visibility,
        branchId: dto.branchId,
        version: { increment: 1 },
      },
    });
  }

  async deleteReport(id: string, restaurantId: string) {
    await this.getReportById(id, restaurantId);
    return this.prisma.customReport.delete({ where: { id } });
  }

  async duplicateReport(id: string, restaurantId: string, userId: string, tenantId: string) {
    const original = await this.getReportById(id, restaurantId);

    return this.prisma.customReport.create({
      data: {
        tenantId,
        restaurantId,
        createdById: userId,
        name: `${original.name} (Copy)`,
        description: original.description,
        dataSource: original.dataSource,
        configuration: original.configuration as any,
        visibility: original.visibility,
        branchId: original.branchId,
        version: 1,
      },
    });
  }

  async runReport(id: string, restaurantId: string, userId?: string, branchOverride?: string): Promise<ReportExecutionResult> {
    const report = await this.getReportById(id, restaurantId);
    const startTime = Date.now();

    const config = report.configuration as unknown as ReportConfigurationDto;
    const branchToUse = branchOverride || report.branchId || undefined;

    try {
      const result = await this.executionEngine.execute(
        restaurantId,
        report.name,
        report.dataSource,
        config,
        branchToUse,
      );

      const durationMs = Date.now() - startTime;

      // Log execution history asynchronously
      void this.prisma.reportExecutionHistory
        .create({
          data: {
            tenantId: report.tenantId,
            restaurantId,
            reportId: report.id,
            triggeredBy: 'MANUAL',
            actorUserId: userId,
            status: 'SUCCESS',
            durationMs,
            recordsCount: result.rows.length,
          },
        })
        .catch((e) => this.logger.error(`Failed to log execution history: ${e?.message}`));

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      void this.prisma.reportExecutionHistory
        .create({
          data: {
            tenantId: report.tenantId,
            restaurantId,
            reportId: report.id,
            triggeredBy: 'MANUAL',
            actorUserId: userId,
            status: 'FAILED',
            durationMs,
            errorMessage: err?.message,
          },
        })
        .catch(() => {});

      throw err;
    }
  }

  async previewReport(
    restaurantId: string,
    reportName: string,
    dataSource: string,
    config: ReportConfigurationDto,
    branchId?: string,
  ): Promise<ReportExecutionResult> {
    return this.executionEngine.execute(restaurantId, reportName, dataSource, config, branchId);
  }
}
