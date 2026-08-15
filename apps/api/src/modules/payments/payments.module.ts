import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
