import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @Permissions(PERMISSIONS.USERS_READ)
  async findAll(
    @Query() query: UsersQueryDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.usersService.findAll(query, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateMyProfileDto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.id, updateMyProfileDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @Permissions(PERMISSIONS.USERS_READ)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.usersService.findById(id, tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @Permissions(PERMISSIONS.USERS_CREATE)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.usersService.create(createUserDto, tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
  @ApiBearerAuth('access-token')
  @Patch(':id')
  @Permissions(PERMISSIONS.USERS_UPDATE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.usersService.update(id, updateUserDto, tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantAccessGuard)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @Permissions(PERMISSIONS.USERS_DELETE)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.usersService.remove(id, currentUser.id, tenantId);
  }
}
