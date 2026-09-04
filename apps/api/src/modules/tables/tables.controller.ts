import {
  BadRequestException,
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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TablesService } from './tables.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import {
  BRANCH_HEADER,
  RESTAURANT_HEADER,
  TENANT_HEADER,
} from '../auth/constants/tenant.constants';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';

@ApiTags('Tables')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@ApiHeader({ name: BRANCH_HEADER, required: true })
@Controller({
  path: 'tables',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Permissions(PERMISSIONS.TABLES_CREATE)
  async create(
    @CurrentBranch() branch: CurrentBranchType,
    @Body() createDto: CreateTableDto,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.create(branch.id, createDto);
  }

  @Get()
  @Permissions(PERMISSIONS.TABLES_READ)
  @ApiQuery({ name: 'diningAreaId', required: false, type: String })
  async findAll(
    @CurrentBranch() branch: CurrentBranchType,
    @Query('diningAreaId') diningAreaId?: string,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.findAll(branch.id, diningAreaId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TABLES_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.findById(id, branch.id);
  }

  @Get(':id/qr')
  @Permissions(PERMISSIONS.TABLES_READ)
  async getQrCode(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
    @Req() req: any,
    @Query('baseUrl') explicitBaseUrl?: string,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    // Explicit baseUrl from client (auto-detected LAN IP) takes priority
    let baseUrl = explicitBaseUrl ?? null;
    if (!baseUrl) {
      const defaultUrl =
        process.env.APP_URL ||
        process.env.WEB_URL ||
        'https://project-atlas-web-self.vercel.app';
      const origin = req.headers.origin || req.headers.referer || defaultUrl;
      try {
        baseUrl = new URL(origin).origin;
      } catch {
        baseUrl = defaultUrl;
      }
    }
    return this.tablesService.getQrCode(id, branch.id, baseUrl);
  }

  @Post(':id/qr/regenerate')
  @Permissions(PERMISSIONS.TABLES_UPDATE)
  async regenerateQrCode(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
    @Req() req: any,
    @Query('baseUrl') explicitBaseUrl?: string,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    let baseUrl = explicitBaseUrl ?? null;
    if (!baseUrl) {
      const defaultUrl =
        process.env.APP_URL ||
        process.env.WEB_URL ||
        'https://project-atlas-web-self.vercel.app';
      const origin = req.headers.origin || req.headers.referer || defaultUrl;
      try {
        baseUrl = new URL(origin).origin;
      } catch {
        baseUrl = defaultUrl;
      }
    }
    return this.tablesService.regenerateQrCode(id, branch.id, baseUrl);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TABLES_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
    @Body() updateDto: UpdateTableDto,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.update(id, branch.id, updateDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TABLES_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.remove(id, branch.id);
  }

  @Post(':id/clear')
  @Permissions(PERMISSIONS.TABLES_UPDATE)
  async clear(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.tablesService.clearTable(id, branch.id);
  }
}
