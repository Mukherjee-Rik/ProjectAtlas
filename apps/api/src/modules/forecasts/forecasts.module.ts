import { Module } from '@nestjs/common';
import { ForecastsController } from './forecasts.controller';
import { FeatureEngineeringService } from './services/feature-engineering.service';
import { ForecastingEngineService } from './services/forecasting-engine.service';
import { MenuDemandForecasterService } from './services/menu-demand-forecaster.service';
import { MealPeriodChannelForecasterService } from './services/meal-period-channel-forecaster.service';
import { ForecastExplainabilityService } from './services/forecast-explainability.service';
import { ModelSelectionService } from './services/model-selection.service';
import { ForecastAccuracyService } from './services/forecast-accuracy.service';
import { ForecastAiGatewayService } from './services/forecast-ai-gateway.service';
import { ForecastJobService } from './services/forecast-job.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DataIntelligenceModule } from '../data-intelligence/data-intelligence.module';

@Module({
  imports: [PrismaModule, CacheModule, DataIntelligenceModule],
  controllers: [ForecastsController],
  providers: [
    FeatureEngineeringService,
    ForecastingEngineService,
    MenuDemandForecasterService,
    MealPeriodChannelForecasterService,
    ForecastExplainabilityService,
    ModelSelectionService,
    ForecastAccuracyService,
    ForecastAiGatewayService,
    ForecastJobService,
  ],
  exports: [
    FeatureEngineeringService,
    ForecastingEngineService,
    MenuDemandForecasterService,
    MealPeriodChannelForecasterService,
    ForecastExplainabilityService,
    ModelSelectionService,
    ForecastAccuracyService,
    ForecastAiGatewayService,
    ForecastJobService,
  ],
})
export class ForecastsModule {}
