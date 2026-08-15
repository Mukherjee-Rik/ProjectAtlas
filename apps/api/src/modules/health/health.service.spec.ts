import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { QueueService } from '../../common/queue/queue.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };
  let queue: { getStats: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
    };
    queue = {
      getStats: jest.fn().mockReturnValue({
        totalJobs: 5,
        waiting: 1,
        active: 0,
        completed: 4,
        retrying: 0,
        deadLetter: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: queue },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should return UP for liveness probe', () => {
    const live = service.getLiveness();
    expect(live.status).toBe('UP');
    expect(typeof live.uptimeSeconds).toBe('number');
  });

  it('should return UP when all components are healthy in readiness probe', async () => {
    const ready = await service.getReadiness();
    expect(ready.status).toBe('UP');
    expect(ready.components.database.status).toBe('UP');
    expect(ready.components.queue.status).toBe('UP');
    expect(ready.components.memory.status).toBe('UP');
  });

  it('should report DOWN when database check fails', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection timeout'));
    const dbHealth = await service.checkDatabase();
    expect(dbHealth.status).toBe('DOWN');
    expect(dbHealth.error).toBe('Database connection failed');
  });
});
