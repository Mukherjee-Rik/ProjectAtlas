import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { QueueService } from '../../common/queue/queue.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, QueueService],
  exports: [HealthService],
})
export class HealthModule {}
