import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import crypto from 'node:crypto';

export type JobType =
  'NOTIFICATION' | 'REPORT' | 'AUTOMATION' | 'EMAIL' | 'MAINTENANCE';
export type JobStatus =
  'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

export interface BackgroundJob<T = any> {
  id: string;
  type: JobType;
  restaurantId?: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  nextRetryAt?: Date;
}

export type JobProcessor<T = any> = (job: BackgroundJob<T>) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);

  private readonly jobs = new Map<string, BackgroundJob>();
  private readonly processors = new Map<JobType, JobProcessor>();
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    // Process queue every 500ms
    this.timer = setInterval(() => void this.processNext(), 500);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Register a processor function for a specific job type.
   */
  registerProcessor<T = any>(type: JobType, processor: JobProcessor<T>) {
    this.processors.set(type, processor);
    this.logger.log(`Registered processor for queue job type: ${type}`);
  }

  /**
   * Enqueue a new background job.
   */
  enqueue<T = any>(
    type: JobType,
    data: T,
    options?: { restaurantId?: string; maxAttempts?: number },
  ): BackgroundJob<T> {
    const id = `job_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const job: BackgroundJob<T> = {
      id,
      type,
      restaurantId: options?.restaurantId,
      data,
      status: 'WAITING',
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Internal queue processor tick.
   */
  private async processNext() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const eligibleJobs = Array.from(this.jobs.values()).filter((j) => {
        if (j.status === 'WAITING') return true;
        if (j.status === 'RETRYING' && j.nextRetryAt && j.nextRetryAt <= now)
          return true;
        return false;
      });

      for (const job of eligibleJobs) {
        const processor = this.processors.get(job.type);
        if (!processor) {
          this.logger.warn(`No processor registered for job type: ${job.type}`);
          continue;
        }

        job.status = 'ACTIVE';
        job.startedAt = new Date();
        job.attempts++;

        try {
          await processor(job);
          job.status = 'COMPLETED';
          job.completedAt = new Date();
          job.lastError = undefined;
        } catch (err: any) {
          const errorMessage = err?.message || String(err);
          job.lastError = errorMessage;

          if (job.attempts < job.maxAttempts) {
            // Exponential backoff: 2s * 2^(attempts-1)
            const backoffMs = Math.min(
              2000 * Math.pow(2, job.attempts - 1),
              60000,
            );
            job.status = 'RETRYING';
            job.nextRetryAt = new Date(Date.now() + backoffMs);
            this.logger.warn(
              `Job ${job.id} (${job.type}) failed attempt ${job.attempts}/${job.maxAttempts}. Retrying in ${backoffMs / 1000}s: ${errorMessage}`,
            );
          } else {
            job.status = 'DEAD_LETTER';
            job.completedAt = new Date();
            this.logger.error(
              `Job ${job.id} (${job.type}) exceeded maximum attempts (${job.maxAttempts}). Moved to DEAD_LETTER: ${errorMessage}`,
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Telemetry stats for platform monitoring dashboard.
   */
  getStats() {
    let waiting = 0;
    let active = 0;
    let completed = 0;
    let retrying = 0;
    let deadLetter = 0;

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'WAITING':
          waiting++;
          break;
        case 'ACTIVE':
          active++;
          break;
        case 'COMPLETED':
          completed++;
          break;
        case 'RETRYING':
          retrying++;
          break;
        case 'DEAD_LETTER':
        case 'FAILED':
          deadLetter++;
          break;
      }
    }

    return {
      totalJobs: this.jobs.size,
      waiting,
      active,
      completed,
      retrying,
      deadLetter,
    };
  }

  /**
   * List all dead-letter (failed) jobs.
   */
  getDeadLetterJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values())
      .filter((j) => j.status === 'DEAD_LETTER' || j.status === 'FAILED')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Re-queue a failed job from the dead-letter queue.
   */
  retryDeadLetterJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'DEAD_LETTER' && job.status !== 'FAILED')) {
      return false;
    }

    job.status = 'WAITING';
    job.attempts = 0;
    job.nextRetryAt = undefined;
    job.lastError = undefined;
    return true;
  }
}
