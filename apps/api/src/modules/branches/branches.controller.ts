import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesService } from './branches.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { TENANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentTenant as CurrentTenantType } from '../auth/types/current-tenant.type';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: TENANT_HEADER,
  required: true,
  description: 'Current tenant organization ID',
})
@Controller({
  path: 'branches',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Permissions(PERMISSIONS.BRANCHES_CREATE)
  async create(
    @CurrentTenant() tenant: CurrentTenantType,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    return this.branchesService.create(tenant.id, createBranchDto);
  }

  @Get()
  @Permissions(PERMISSIONS.BRANCHES_READ)
  @ApiQuery({ name: 'restaurantId', required: false, type: String })
  async findAll(
    @CurrentTenant() tenant: CurrentTenantType,
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.branchesService.findAll(tenant.id, restaurantId, user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.BRANCHES_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenant: CurrentTenantType,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.findById(id, tenant.id, user);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.BRANCHES_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenant: CurrentTenantType,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, tenant.id, updateBranchDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.BRANCHES_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenant: CurrentTenantType,
  ) {
    return this.branchesService.remove(id, tenant.id);
  }
}
