import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { KpiEngineService } from './services/kpi-engine.service';
import { ComparisonEngineService } from './services/comparison-engine.service';
import { TimeSeriesAnalyticsService } from './services/time-series-analytics.service';
import { RevenueAnalyticsService } from './services/revenue-analytics.service';
import { MenuProductAnalyticsService } from './services/menu-product-analytics.service';
import { CustomerCohortAnalyticsService } from './services/customer-cohort-analytics.service';
import { BranchStaffAnalyticsService } from './services/branch-staff-analytics.service';
import { OperationalDemandAnalyticsService } from './services/operational-demand-analytics.service';
import { DrillDownService } from './services/drill-down.service';
import { AnalyticsExportService } from './services/analytics-export.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DataIntelligenceModule } from '../data-intelligence/data-intelligence.module';

@Module({
  imports: [PrismaModule, CacheModule, DataIntelligenceModule],
  controllers: [AnalyticsController],
  providers: [
    KpiEngineService,
    ComparisonEngineService,
    TimeSeriesAnalyticsService,
    RevenueAnalyticsService,
    MenuProductAnalyticsService,
    CustomerCohortAnalyticsService,
    BranchStaffAnalyticsService,
    OperationalDemandAnalyticsService,
    DrillDownService,
    AnalyticsExportService,
  ],
  exports: [
    KpiEngineService,
    ComparisonEngineService,
    TimeSeriesAnalyticsService,
    RevenueAnalyticsService,
    MenuProductAnalyticsService,
    CustomerCohortAnalyticsService,
    BranchStaffAnalyticsService,
    OperationalDemandAnalyticsService,
    DrillDownService,
    AnalyticsExportService,
  ],
})
export class AnalyticsModule {}
