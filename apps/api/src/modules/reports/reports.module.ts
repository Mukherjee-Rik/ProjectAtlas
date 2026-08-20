import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportService } from './services/report.service';
import { ReportValidatorService } from './services/report-validator.service';
import { ReportExecutionEngineService } from './services/report-execution-engine.service';
import { ReportTemplateService } from './services/report-template.service';
import { ReportSchedulerService } from './services/report-scheduler.service';
import { ReportExportService } from './services/report-export.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DataIntelligenceModule } from '../data-intelligence/data-intelligence.module';

@Module({
  imports: [PrismaModule, CacheModule, DataIntelligenceModule],
  controllers: [ReportsController],
  providers: [
    ReportService,
    ReportValidatorService,
    ReportExecutionEngineService,
    ReportTemplateService,
    ReportSchedulerService,
    ReportExportService,
  ],
  exports: [
    ReportService,
    ReportValidatorService,
    ReportExecutionEngineService,
    ReportTemplateService,
    ReportSchedulerService,
    ReportExportService,
  ],
})
export class ReportsModule {}
