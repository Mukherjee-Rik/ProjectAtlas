import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { MetricsService } from '../../common/metrics/metrics.service';
import { QueueService } from '../../common/queue/queue.service';
import { HealthService } from '../health/health.service';

@ApiTags('Platform Monitoring & Observability')
@ApiBearerAuth('access-token')
@Controller({ path: 'monitoring', version: '1' })
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly queueService: QueueService,
    private readonly healthService: HealthService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Get comprehensive system telemetry, health, and latency percentiles for platform admins',
  })
  async getOverview() {
    const system = this.metricsService.getSystemOverview();
    const readiness = await this.healthService.getReadiness();
    const queueStats = this.queueService.getStats();
    const topEndpoints = this.metricsService.getTopEndpoints();

    return {
      status: readiness.status === 'UP' ? 'HEALTHY' : 'DEGRADED',
      components: {
        api: { status: 'UP' },
        database: readiness.components.database,
        queue: readiness.components.queue,
        memory: readiness.components.memory,
      },
      telemetry: {
        throughput: system.throughput,
        latencyMs: system.latencyMs,
        errors: system.errors,
        memory: system.memory,
        cpu: system.cpu,
        uptimeSeconds: system.uptimeSeconds,
      },
      queue: queueStats,
      topEndpoints,
    };
  }

  @Get('dead-letter')
  @ApiOperation({ summary: 'List failed / dead-letter background jobs' })
  getDeadLetterJobs() {
    return this.queueService.getDeadLetterJobs();
  }

  @Post('dead-letter/:id/retry')
  @ApiOperation({ summary: 'Retry a failed dead-letter background job' })
  retryDeadLetterJob(@Param('id') id: string) {
    const retried = this.queueService.retryDeadLetterJob(id);
    if (!retried) {
      throw new NotFoundException(`Dead-letter job with id "${id}" not found`);
    }
    return { success: true, jobId: id };
  }
}
