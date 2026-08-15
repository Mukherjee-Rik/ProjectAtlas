import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansController } from './plans.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionUsageService } from './subscription-usage.service';

@Module({
  controllers: [SubscriptionsController, PlansController],
  providers: [SubscriptionsService, SubscriptionUsageService],
  exports: [SubscriptionsService, SubscriptionUsageService],
})
export class SubscriptionsModule {}
