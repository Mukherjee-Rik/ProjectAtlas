import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TableCallsService } from './table-calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { BRANCH_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

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
      throw new BadRequestException(
        'Invalid call type. Must be WAITER, WATER, or BILL.',
      );
    }
    return this.tableCallsService.createCall(token, body.type);
  }

  @ApiBearerAuth('access-token')
  @ApiHeader({ name: BRANCH_HEADER, required: true })
  @UseGuards(JwtAuthGuard, BranchAccessGuard)
  @Get('table-calls')
  async getPendingCalls(@CurrentBranch() branch: CurrentBranchType) {
    if (!branch?.id) {
      throw new BadRequestException('Active branch context is required');
    }
    return this.tableCallsService.getPendingCalls(branch.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('table-calls/:id/resolve')
  async resolveCall(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tableCallsService.resolveCallForUser(id, user.id, user.role);
  }
}
