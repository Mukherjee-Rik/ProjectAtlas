import { Module } from '@nestjs/common';
import { PublicTablesController } from './public-tables.controller';
import { PublicTablesService } from './public-tables.service';

@Module({
  controllers: [PublicTablesController],
  providers: [PublicTablesService],
  exports: [PublicTablesService],
})
export class PublicTablesModule {}
