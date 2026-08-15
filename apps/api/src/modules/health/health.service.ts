import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { QueueService } from '../../common/queue/queue.service';

export interface ComponentHealth {
  status: 'UP' | 'DOWN';
  latencyMs?: number;
  details?: Record<string, any>;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Basic liveness probe (is process responsive)
   */
  getLiveness() {
    return {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep readiness probe (checks PostgreSQL connectivity, queue engine, memory)
   */
  async getReadiness() {
    const dbHealth = await this.checkDatabase();
    const queueHealth = this.checkQueue();
    const memoryHealth = this.checkMemory();

    const isReady = dbHealth.status === 'UP' && queueHealth.status === 'UP' && memoryHealth.status === 'UP';

    return {
      status: isReady ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      components: {
        database: dbHealth,
        queue: queueHealth,
        memory: memoryHealth,
      },
    };
  }

  /**
   * Dedicated database health check
   */
  async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return {
        status: 'UP',
        latencyMs,
        details: { connection: 'active' },
      };
    } catch (err: any) {
      this.logger.error(`Database health check failed: ${err.message}`);
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: 'Database connection failed',
      };
    }
  }

  private checkQueue(): ComponentHealth {
    const stats = this.queueService.getStats();
    return {
      status: 'UP',
      details: stats,
    };
  }

  private checkMemory(): ComponentHealth {
    const memory = process.memoryUsage();
    const heapUsedMb = Math.round(memory.heapUsed / (1024 * 1024));
    const isHealthy = heapUsedMb < 1500; // Under 1.5 GB limit

    return {
      status: isHealthy ? 'UP' : 'DOWN',
      details: {
        heapUsedMb,
        rssMb: Math.round(memory.rss / (1024 * 1024)),
      },
    };
  }
}
