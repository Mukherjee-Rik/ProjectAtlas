import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller({
  path: 'audit',
  version: '1',
})
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@ApiBearerAuth('access-token')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get security audit logs (Platform Admin only)' })
  async getLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('actorEmail') actorEmail?: string,
  ) {
    return this.auditService.getLogs({
      startDate,
      endDate,
      action,
      restaurantId,
      actorEmail,
    });
  }
}
