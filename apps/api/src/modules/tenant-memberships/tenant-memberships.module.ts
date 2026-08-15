import { Module } from '@nestjs/common';

import { TenantMembershipsController } from './tenant-memberships.controller';
import { TenantMembershipsService } from './tenant-memberships.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [TenantMembershipsController],
  providers: [TenantMembershipsService],
  exports: [TenantMembershipsService],
})
export class TenantMembershipsModule {}
