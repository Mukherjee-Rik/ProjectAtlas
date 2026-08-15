import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AutomationEngineService } from './automation-engine.service';
import * as cron from 'node-cron';

@Injectable()
export class AutomationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AutomationSchedulerService.name);
  private readonly jobs = new Map<string, cron.ScheduledTask>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AutomationEngineService,
  ) {}

  async onModuleInit() {
    await this.loadScheduledRules();
  }

  async loadScheduledRules() {
    // Clear existing jobs
    for (const [id, task] of this.jobs) {
      task.stop();
    }
    this.jobs.clear();

    const rules = await this.prisma.automationRule.findMany({
      where: { triggerType: 'SCHEDULED', enabled: true },
    });

    for (const rule of rules) {
      if (rule.schedule && cron.validate(rule.schedule)) {
        this.registerJob(rule.id, rule.schedule, rule.name);
      } else {
        this.logger.warn(`Invalid cron expression for rule "${rule.name}": ${rule.schedule}`);
      }
    }

    this.logger.log(`Loaded ${this.jobs.size} scheduled automation jobs`);
  }

  registerJob(ruleId: string, schedule: string, name: string) {
    if (this.jobs.has(ruleId)) {
      this.jobs.get(ruleId)!.stop();
    }

    const task = cron.schedule(schedule, async () => {
      this.logger.log(`⏰ Executing scheduled automation: "${name}" (${ruleId})`);
      try {
        await this.engine.evaluateRule(ruleId);
      } catch (err: any) {
        this.logger.error(`Scheduled automation "${name}" failed: ${err.message}`);
      }
    });

    this.jobs.set(ruleId, task);
    this.logger.log(`Registered cron job for "${name}": ${schedule}`);
  }

  unregisterJob(ruleId: string) {
    const task = this.jobs.get(ruleId);
    if (task) {
      task.stop();
      this.jobs.delete(ruleId);
    }
  }

  async reloadRules() {
    await this.loadScheduledRules();
  }

  getActiveJobCount(): number {
    return this.jobs.size;
  }
}
