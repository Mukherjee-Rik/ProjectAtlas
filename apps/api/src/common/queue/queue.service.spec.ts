import { QueueService } from './queue.service';

describe('QueueService', () => {
  let queue: QueueService;

  beforeEach(() => {
    queue = new QueueService();
  });

  afterEach(() => {
    queue.onModuleDestroy();
  });

  it('should enqueue and successfully process a background job', async () => {
    let processed = false;
    queue.registerProcessor('NOTIFICATION', async (job) => {
      processed = true;
      expect(job.data).toEqual({ message: 'Hello Atlas' });
    });

    const job = queue.enqueue('NOTIFICATION', { message: 'Hello Atlas' });
    expect(job.status).toBe('WAITING');
    expect(job.id).toBeDefined();

    // Trigger internal loop tick
    await (queue as any).processNext();

    expect(processed).toBe(true);
    expect(job.status).toBe('COMPLETED');
    expect(job.attempts).toBe(1);
  });

  it('should retry a failed job and record attempts', async () => {
    let attempts = 0;
    queue.registerProcessor('REPORT', async () => {
      attempts++;
      throw new Error('Timeout error');
    });

    const job = queue.enqueue(
      'REPORT',
      { reportId: '123' },
      { maxAttempts: 3 },
    );

    // Attempt 1 -> should fail and enter RETRYING
    await (queue as any).processNext();
    expect(attempts).toBe(1);
    expect(job.status).toBe('RETRYING');
    expect(job.attempts).toBe(1);
    expect(job.nextRetryAt).toBeDefined();
  });

  it('should move to DEAD_LETTER when maximum retries are exhausted', async () => {
    queue.registerProcessor('AUTOMATION', async () => {
      throw new Error('Fatal database constraint');
    });

    const job = queue.enqueue(
      'AUTOMATION',
      { ruleId: 'rule_1' },
      { maxAttempts: 1 },
    );

    // Attempt 1 (max 1) -> DEAD_LETTER
    await (queue as any).processNext();

    expect(job.status).toBe('DEAD_LETTER');
    expect(job.attempts).toBe(1);
    expect(job.lastError).toContain('Fatal database constraint');

    const deadLetters = queue.getDeadLetterJobs();
    expect(deadLetters.length).toBe(1);
    expect(deadLetters[0].id).toBe(job.id);
  });

  it('should re-queue a dead-letter job on manual retry', async () => {
    queue.registerProcessor('EMAIL', async () => {
      throw new Error('SMTP host unreachable');
    });

    const job = queue.enqueue(
      'EMAIL',
      { to: 'chef@atlas.com' },
      { maxAttempts: 1 },
    );
    await (queue as any).processNext();
    expect(job.status).toBe('DEAD_LETTER');

    const retried = queue.retryDeadLetterJob(job.id);
    expect(retried).toBe(true);
    expect(job.status).toBe('WAITING');
    expect(job.attempts).toBe(0);
  });
});
