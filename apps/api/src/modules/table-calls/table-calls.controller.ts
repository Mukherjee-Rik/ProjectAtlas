import { Controller, Get, Post, Body, Param, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { TableCallsService } from './table-calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Table Calls')
@Controller({
  path: '',
  version: '1',
})
export class TableCallsController {
  constructor(private readonly tableCallsService: TableCallsService) {}

  @Post('public/tables/:token/call')
  async createCall(
    @Param('token') token: string,
    @Body() body: { type: 'WAITER' | 'WATER' | 'BILL' },
  ) {
    if (!body.type || !['WAITER', 'WATER', 'BILL'].includes(body.type)) {
      throw new BadRequestException('Invalid call type. Must be WAITER, WATER, or BILL.');
    }
    return this.tableCallsService.createCall(token, body.type);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('table-calls')
  async getPendingCalls(@Headers('x-branch-id') branchId?: string) {
    if (!branchId) {
      throw new BadRequestException('x-branch-id header is required');
    }
    return this.tableCallsService.getPendingCalls(branchId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('table-calls/:id/resolve')
  async resolveCall(@Param('id') id: string) {
    return this.tableCallsService.resolveCall(id);
  }
}
