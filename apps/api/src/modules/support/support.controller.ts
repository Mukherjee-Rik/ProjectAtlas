import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { SupportService, CreateSupportTicketDto, ResolveSupportTicketDto } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RESTAURANT_HEADER } from '../auth/constants/tenant.constants';

@ApiTags('Support')
@Controller({ path: 'support', version: '1' })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Headers(RESTAURANT_HEADER) restaurantIdHeader: string,
    @Body() dto: CreateSupportTicketDto,
  ) {
    const restaurantId = dto.restaurantId || restaurantIdHeader;
    return this.supportService.createTicket(user?.id, {
      ...dto,
      restaurantId,
    });
  }

  @Get('tickets')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async getRestaurantTickets(
    @Headers(RESTAURANT_HEADER) restaurantId: string,
    @Query('restaurantId') queryRestId?: string,
  ) {
    const targetRestId = queryRestId || restaurantId;
    return this.supportService.getRestaurantTickets(targetRestId);
  }

  @Get('admin/tickets')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async getAllAdminTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.supportService.getAllAdminTickets(status, priority);
  }

  @Patch('tickets/:id/resolve')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async resolveTicket(
    @Param('id') ticketId: string,
    @Body() dto: ResolveSupportTicketDto,
  ) {
    return this.supportService.resolveTicket(ticketId, dto);
  }
}
