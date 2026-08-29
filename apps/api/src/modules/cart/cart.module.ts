import { Module } from '@nestjs/common';
import { CacheModule } from '../../common/cache/cache.module';
import { PublicTablesModule } from '../public-tables/public-tables.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [PublicTablesModule, CacheModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
