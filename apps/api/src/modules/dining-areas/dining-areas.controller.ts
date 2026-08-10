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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

import { CreateDiningAreaDto } from './dto/create-dining-area.dto';
import { UpdateDiningAreaDto } from './dto/update-dining-area.dto';
import { DiningAreasService } from './dining-areas.service';

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

@ApiTags('Dining Areas')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@ApiHeader({ name: BRANCH_HEADER, required: true })
@Controller({
  path: 'dining-areas',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
)
export class DiningAreasController {
  constructor(private readonly diningAreasService: DiningAreasService) {}

  @Post()
  @Permissions(PERMISSIONS.DINING_AREAS_CREATE)
  async create(
    @CurrentBranch() branch: CurrentBranchType,
    @Body() createDto: CreateDiningAreaDto,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.diningAreasService.create(branch.id, createDto);
  }

  @Get()
  @Permissions(PERMISSIONS.DINING_AREAS_READ)
  async findAll(@CurrentBranch() branch: CurrentBranchType) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.diningAreasService.findAll(branch.id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DINING_AREAS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.diningAreasService.findById(id, branch.id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DINING_AREAS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
    @Body() updateDto: UpdateDiningAreaDto,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.diningAreasService.update(id, branch.id, updateDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DINING_AREAS_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentBranch() branch: CurrentBranchType,
  ) {
    if (!branch) {
      throw new BadRequestException('No active branch selected');
    }
    return this.diningAreasService.remove(id, branch.id);
  }
}
