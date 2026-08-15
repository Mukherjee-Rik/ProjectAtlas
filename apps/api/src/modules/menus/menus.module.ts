import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
