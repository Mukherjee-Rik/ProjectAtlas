import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@Controller({
  path: 'tenants',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Permissions(PERMISSIONS.TENANTS_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    // Scoped to the caller — see TenantsService.findAllForUser.
    return this.tenantsService.findAllForUser(user.id, user.role);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TENANTS_READ)
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantsService.findById(id);
  }

  @Post()
  @Permissions(PERMISSIONS.TENANTS_CREATE)
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }
}
