import { Module } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { PublicTablesController } from './public-tables.controller';
import { PublicTablesService } from './public-tables.service';

@Module({
  imports: [CacheModule],
  controllers: [PublicTablesController],
  providers: [PublicTablesService],
  exports: [PublicTablesService],
})
export class PublicTablesModule {}
