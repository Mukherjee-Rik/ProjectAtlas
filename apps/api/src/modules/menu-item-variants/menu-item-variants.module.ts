import { Module } from '@nestjs/common';
import { MenuItemVariantsController } from './menu-item-variants.controller';
import { MenuItemVariantsService } from './menu-item-variants.service';

@Module({ controllers: [MenuItemVariantsController], providers: [MenuItemVariantsService], exports: [MenuItemVariantsService] })
export class MenuItemVariantsModule {}
