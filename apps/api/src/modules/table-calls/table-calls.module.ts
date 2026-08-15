import { Module } from '@nestjs/common';
import { TableCallsController } from './table-calls.controller';
import { TableCallsService } from './table-calls.service';
import { PublicTablesModule } from '../public-tables/public-tables.module';

@Module({
  imports: [PublicTablesModule],
  controllers: [TableCallsController],
  providers: [TableCallsService],
  exports: [TableCallsService],
})
export class TableCallsModule {}
