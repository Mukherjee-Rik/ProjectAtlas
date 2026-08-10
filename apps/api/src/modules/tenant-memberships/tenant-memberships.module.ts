import { Module } from '@nestjs/common';

import { TenantMembershipsController } from './tenant-memberships.controller';
import { TenantMembershipsService } from './tenant-memberships.service';

@Module({
  controllers: [TenantMembershipsController],
  providers: [TenantMembershipsService],
  exports: [TenantMembershipsService],
})
export class TenantMembershipsModule {}
