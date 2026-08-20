import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ForecastingEngineService, SalesForecastResult } from './forecasting-engine.service';
import { MenuDemandForecasterService, ItemDemandForecast } from './menu-demand-forecaster.service';
import { ForecastAccuracyService } from './forecast-accuracy.service';

@Injectable()
export class ForecastJobService {
  private readonly logger = new Logger(ForecastJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastingEngine: ForecastingEngineService,
    private readonly menuDemandForecaster: MenuDemandForecasterService,
    private readonly accuracyService: ForecastAccuracyService,
  ) {}

  /**
   * Orchestrates a complete forecasting cycle and stores predictions.
   */
  async runForecastCycle(
    restaurantId: string,
    tenantId: string,
    branchId?: string,
    horizon: '7D' | '14D' | '30D' = '7D',
    modelVersion = 'seasonal-dow-v1',
  ): Promise<{ salesForecast: SalesForecastResult; menuForecast: ItemDemandForecast[] }> {
    const startTime = Date.now();
    const horizonDays = horizon === '30D' ? 30 : horizon === '14D' ? 14 : 7;

    try {
      // 1. Generate Sales Forecast
      const salesForecast = await this.forecastingEngine.generateSalesForecast(
        restaurantId,
        branchId,
        horizonDays,
        modelVersion,
      );

      // 2. Generate Menu Demand Forecast
      const menuForecast = await this.menuDemandForecaster.forecastMenuDemand(restaurantId, branchId);

      // 3. Persist Forecast Record
      const forecastRecord = await this.prisma.forecast.create({
        data: {
          tenantId,
          restaurantId,
          branchId,
          forecastType: 'SALES',
          granularity: 'DAILY',
          startDate: new Date(salesForecast.startDate),
          endDate: new Date(salesForecast.endDate),
          modelVersion,
          status: 'COMPLETED',
          metadata: {
            summary: salesForecast.summary,
            itemCount: menuForecast.length,
          } as any,
        },
      });

      // 4. Persist Forecast Points (Daily Sales)
      const pointsData = salesForecast.dailyProjections.map((p) => ({
        forecastId: forecastRecord.id,
        timestamp: new Date(p.date),
        metric: 'GROSS_SALES',
        entityType: branchId ? 'BRANCH' : 'RESTAURANT',
        entityId: branchId || restaurantId,
        predictedValue: p.predictedSales,
        lowerBound: p.lowerBoundSales,
        upperBound: p.upperBoundSales,
        confidence: p.confidence,
      }));

      await this.prisma.forecastPoint.createMany({
        data: pointsData,
      });

      const durationMs = Date.now() - startTime;

      // 5. Log Run Telemetry
      await this.prisma.forecastRun.create({
        data: {
          tenantId,
          restaurantId,
          branchId,
          modelVersion,
          recordsProcessed: salesForecast.dailyProjections.length + menuForecast.length,
          errorCount: 0,
          executionTimeMs: durationMs,
          status: 'SUCCESS',
        },
      });

      return { salesForecast, menuForecast };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`Forecast cycle failed for restaurant ${restaurantId}: ${err?.message}`);

      await this.prisma.forecastRun.create({
        data: {
          tenantId,
          restaurantId,
          branchId,
          modelVersion,
          recordsProcessed: 0,
          errorCount: 1,
          executionTimeMs: durationMs,
          status: 'FAILED',
          errorMessage: err?.message,
        },
      });

      throw err;
    }
  }

  /**
   * Retrieves recent forecast runs telemetry.
   */
  async listRuns(restaurantId: string, limit = 10) {
    return this.prisma.forecastRun.findMany({
      where: { restaurantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
