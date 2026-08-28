import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { EmailDispatcherService } from './email-dispatcher.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, EmailDispatcherService],
  exports: [SupportService, EmailDispatcherService],
})
export class SupportModule {}
