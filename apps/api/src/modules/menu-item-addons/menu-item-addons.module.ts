import { Module } from '@nestjs/common';
import { MenuItemAddonsController } from './menu-item-addons.controller';
import { MenuItemAddonsService } from './menu-item-addons.service';

@Module({
  controllers: [MenuItemAddonsController],
  providers: [MenuItemAddonsService],
  exports: [MenuItemAddonsService],
})
export class MenuItemAddonsModule {}
