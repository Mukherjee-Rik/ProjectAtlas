import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SupportService,
  CreateSupportTicketDto,
  ResolveSupportTicketDto,
  ContactInquiryDto,
} from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import { RESTAURANT_HEADER } from '../auth/constants/tenant.constants';

@ApiTags('Support')
@Controller({ path: 'support', version: '1' })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @ApiOperation({ summary: 'Submit public contact / talk-to-us inquiry' })
  async submitContactInquiry(@Body() dto: ContactInquiryDto) {
    if (!dto.name || !dto.email || !dto.phone || !dto.message) {
      throw new BadRequestException('Name, email, phone number, and message are required');
    }
    return this.supportService.handleContactInquiry(dto);
  }

  @Post('tickets')
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() dto: CreateSupportTicketDto,
  ) {
    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }
    return this.supportService.createTicket(user?.id, {
      ...dto,
      restaurantId: restaurant.id,
    });
  }

  @Get('tickets')
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: RESTAURANT_HEADER, required: true })
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  async getRestaurantTickets(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant?.id) {
      throw new BadRequestException('Restaurant context is required');
    }
    return this.supportService.getRestaurantTickets(restaurant.id);
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResolveSupportTicketDto,
  ) {
    return this.supportService.resolveTicketForUser(ticketId, user.id, user.role, dto);
  }
}
