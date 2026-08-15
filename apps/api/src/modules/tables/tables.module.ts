import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
