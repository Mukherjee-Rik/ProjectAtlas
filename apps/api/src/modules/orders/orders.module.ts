import { Module } from '@nestjs/common';
import { PublicTablesModule } from '../public-tables/public-tables.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PublicTablesModule, InventoryModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
