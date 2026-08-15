import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from '../../common/metrics/metrics.service';
import { QueueService } from '../../common/queue/queue.service';
import { HealthService } from '../health/health.service';

@Module({
  controllers: [MonitoringController],
  providers: [MetricsService, QueueService, HealthService],
})
export class MonitoringModule {}
