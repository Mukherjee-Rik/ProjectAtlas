import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationRuleService } from './services/automation-rule.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { AutomationSchedulerService } from './services/automation-scheduler.service';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [AutomationController],
  providers: [
    AutomationRuleService,
    AutomationEngineService,
    AutomationSchedulerService,
    NotificationService,
  ],
  exports: [NotificationService, AutomationEngineService],
})
export class AutomationModule {}
