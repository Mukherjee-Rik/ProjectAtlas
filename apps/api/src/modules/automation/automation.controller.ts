import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { AutomationRuleService } from './services/automation-rule.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { AutomationSchedulerService } from './services/automation-scheduler.service';
import { NotificationService } from './services/notification.service';
import { RESTAURANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import * as express from 'express';

@ApiTags('Automation & Notifications')
@ApiBearerAuth('access-token')
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@Controller({ path: 'automations', version: '1' })
export class AutomationController {
  constructor(
    private readonly ruleService: AutomationRuleService,
    private readonly engine: AutomationEngineService,
    private readonly scheduler: AutomationSchedulerService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Automation Rules ──────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Create an automation rule' })
  async createRule(
    @CurrentUser('id') userId: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: any,
  ) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');

    const rule = await this.ruleService.create(restaurant.id, userId, body);

    if (rule.triggerType === 'SCHEDULED' && rule.schedule) {
      this.scheduler.registerJob(rule.id, rule.schedule, rule.name);
    }

    return rule;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'List all automation rules for the restaurant' })
  async listRules(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    return this.ruleService.findAll(restaurant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Update an automation rule' })
  async updateRule(
    @Param('id') id: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: any,
  ) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');

    const updated = await this.ruleService.update(id, restaurant.id, body);

    if (updated.triggerType === 'SCHEDULED') {
      if (updated.enabled && updated.schedule) {
        this.scheduler.registerJob(updated.id, updated.schedule, updated.name);
      } else {
        this.scheduler.unregisterJob(updated.id);
      }
    }

    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Delete an automation rule' })
  async deleteRule(@Param('id') id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');

    this.scheduler.unregisterJob(id);
    return this.ruleService.remove(id, restaurant.id);
  }

  @Get(':id/executions')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'View execution history for a rule' })
  async getExecutions(@Param('id') id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    return this.ruleService.getExecutions(id, restaurant.id);
  }

  @Post(':id/test')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Manually test-run an automation rule' })
  async testRule(@Param('id') id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');

    await this.ruleService.findById(id, restaurant.id);
    const fired = await this.engine.evaluateRule(id);
    return { fired };
  }

  // ── Notifications ─────────────────────────────────────

  @Get('/notifications/list')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'List notifications for the current user' })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    return this.notificationService.getForUser(restaurant.id, userId);
  }

  @Get('/notifications/unread-count')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
  ) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    return { count: await this.notificationService.getUnreadCount(restaurant.id, userId) };
  }

  @Patch('/notifications/:id/read')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    return this.notificationService.markAsRead(id, restaurant.id);
  }

  // ── Platform Admin Monitoring ─────────────────────────

  @Get('/admin/stats')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiOperation({ summary: 'Get system-wide automation engine metrics for platform admins' })
  async getAdminStats() {
    return this.engine.getAdminStats();
  }

  // ── Event-Driven Automation Trigger ───────────────────

  @Post('/events/trigger')
  @UseGuards(JwtAuthGuard, RestaurantAccessGuard)
  @ApiOperation({ summary: 'Emit an event to evaluate matching event automations' })
  async triggerEvent(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Body() body: { eventType: string; payload?: any },
  ) {
    if (!restaurant?.id) throw new BadRequestException('Restaurant context is required');
    if (!body.eventType) throw new BadRequestException('eventType is required');

    const firedCount = await this.engine.handleEvent(body.eventType, restaurant.id, body.payload);
    return { eventType: body.eventType, firedRulesCount: firedCount };
  }
}
