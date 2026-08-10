import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { TenantMembershipsService } from './tenant-memberships.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';

@ApiTags('Tenant Memberships')
@ApiBearerAuth('access-token')
@Controller({
  path: 'tenant-memberships',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantMembershipsController {
  constructor(
    private readonly tenantMembershipsService: TenantMembershipsService,
  ) {}

  @Post()
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_CREATE)
  async create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.tenantMembershipsService.create(createMembershipDto);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantMembershipsService.findById(id);
  }

  @Get('user/:userId')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findByUser(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.tenantMembershipsService.findByUser(userId);
  }

  @Get('tenant/:tenantId')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findByTenant(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.tenantMembershipsService.findByTenant(tenantId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.tenantMembershipsService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_DELETE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantMembershipsService.remove(id);
  }
}
