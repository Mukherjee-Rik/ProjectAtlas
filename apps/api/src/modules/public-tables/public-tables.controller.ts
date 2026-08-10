import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicTablesService } from './public-tables.service';

@ApiTags('Public Tables')
@Controller({ path: 'public/tables', version: '1' })
export class PublicTablesController {
  constructor(private readonly publicTablesService: PublicTablesService) {}

  @Get(':token')
  async resolveTableToken(@Param('token') token: string) {
    return this.publicTablesService.resolveTableToken(token);
  }

  @Get(':token/menu')
  async getPublicTableMenu(@Param('token') token: string) {
    return this.publicTablesService.getPublicTableMenu(token);
  }

  @Get(':token/menu-items/:itemId')
  async getPublicMenuItem(@Param('token') token: string, @Param('itemId') itemId: string) {
    return this.publicTablesService.getPublicMenuItem(token, itemId);
  }

  @Post(':token/session')
  async getOrCreateSession(@Param('token') token: string) {
    return this.publicTablesService.getOrCreateSession(token);
  }

  @Post(':token/session/end')
  async endSession(@Param('token') token: string) {
    return this.publicTablesService.endSession(token);
  }
}
