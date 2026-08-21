import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { TenantMembershipsService } from './tenant-memberships.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { CurrentTenant as CurrentTenantType } from '../auth/types/current-tenant.type';

@ApiTags('Tenant Memberships')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: false })
@Controller({
  path: 'tenant-memberships',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
export class TenantMembershipsController {
  constructor(
    private readonly tenantMembershipsService: TenantMembershipsService,
  ) {}

  @Post()
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_CREATE)
  async create(
    @Body() createMembershipDto: CreateMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    if (user.role !== 'PLATFORM_ADMIN') {
      const activeTenantId = tenant?.id || createMembershipDto.tenantId;
      if (!activeTenantId || activeTenantId !== createMembershipDto.tenantId) {
        throw new ForbiddenException('Cannot assign memberships outside your tenant');
      }
    }
    return this.tenantMembershipsService.create(createMembershipDto);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    return this.tenantMembershipsService.findByIdForUser(id, user.id, user.role, tenant?.id);
  }

  @Get('user/:userId')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== 'PLATFORM_ADMIN' && user.id !== userId) {
      throw new ForbiddenException('Cannot view memberships of other users');
    }
    return this.tenantMembershipsService.findByUser(userId);
  }

  @Get('tenant/:tenantId')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_READ)
  async findByTenant(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    if (user.role !== 'PLATFORM_ADMIN' && tenant?.id !== tenantId) {
      throw new ForbiddenException('Cannot view memberships for other tenants');
    }
    return this.tenantMembershipsService.findByTenant(tenantId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    return this.tenantMembershipsService.updateForUser(id, updateMembershipDto, user.id, user.role, tenant?.id);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TENANT_MEMBERSHIPS_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    return this.tenantMembershipsService.removeForUser(id, user.id, user.role, tenant?.id);
  }
}
