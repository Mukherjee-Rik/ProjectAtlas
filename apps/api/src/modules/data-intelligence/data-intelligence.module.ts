import { Module } from '@nestjs/common';
import { DataIntelligenceController } from './data-intelligence.controller';
import { OperationalEventService } from './services/operational-event.service';
import { DataAggregationEngineService } from './services/data-aggregation-engine.service';
import { DataQualityService } from './services/data-quality.service';
import { AiDataGatewayService } from './services/ai-data-gateway.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [DataIntelligenceController],
  providers: [
    OperationalEventService,
    DataAggregationEngineService,
    DataQualityService,
    AiDataGatewayService,
  ],
  exports: [
    OperationalEventService,
    DataAggregationEngineService,
    DataQualityService,
    AiDataGatewayService,
  ],
})
export class DataIntelligenceModule {}
