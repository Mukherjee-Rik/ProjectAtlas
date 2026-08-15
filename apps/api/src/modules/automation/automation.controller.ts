import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AutomationRuleService } from './services/automation-rule.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { AutomationSchedulerService } from './services/automation-scheduler.service';
import { NotificationService } from './services/notification.service';
import * as express from 'express';

@ApiTags('Automation & Notifications')
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an automation rule' })
  async createRule(
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
    @Body() body: any,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');

    const rule = await this.ruleService.create(restaurantId, userId, body);

    // If scheduled, register the cron job immediately
    if (rule.triggerType === 'SCHEDULED' && rule.schedule) {
      this.scheduler.registerJob(rule.id, rule.schedule, rule.name);
    }

    return rule;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all automation rules for the restaurant' })
  async listRules(@Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    return this.ruleService.findAll(restaurantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an automation rule' })
  async updateRule(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Body() body: any,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');

    const updated = await this.ruleService.update(id, restaurantId, body);

    // Reload scheduler if schedule changed
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an automation rule' })
  async deleteRule(@Param('id') id: string, @Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');

    this.scheduler.unregisterJob(id);
    return this.ruleService.remove(id, restaurantId);
  }

  @Get(':id/executions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'View execution history for a rule' })
  async getExecutions(@Param('id') id: string, @Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    return this.ruleService.getExecutions(id, restaurantId);
  }

  @Post(':id/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually test-run an automation rule' })
  async testRule(@Param('id') id: string, @Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');

    await this.ruleService.findById(id, restaurantId);
    const fired = await this.engine.evaluateRule(id);
    return { fired };
  }

  // ── Notifications ─────────────────────────────────────

  @Get('/notifications/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List notifications for the current user' })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    return this.notificationService.getForUser(restaurantId, userId);
  }

  @Get('/notifications/unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    return { count: await this.notificationService.getUnreadCount(restaurantId, userId) };
  }

  @Patch('/notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @Req() req: express.Request) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    return this.notificationService.markAsRead(id, restaurantId);
  }

  // ── Platform Admin Monitoring ─────────────────────────

  @Get('/admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get system-wide automation engine metrics for platform admins' })
  async getAdminStats() {
    return this.engine.getAdminStats();
  }

  // ── Event-Driven Automation Trigger ───────────────────

  @Post('/events/trigger')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Emit an event to evaluate matching event automations' })
  async triggerEvent(
    @Req() req: express.Request,
    @Body() body: { eventType: string; payload?: any },
  ) {
    const restaurantId = req.headers['x-restaurant-id'] as string;
    if (!restaurantId) throw new BadRequestException('x-restaurant-id header is required');
    if (!body.eventType) throw new BadRequestException('eventType is required');

    const firedCount = await this.engine.handleEvent(body.eventType, restaurantId, body.payload);
    return { eventType: body.eventType, firedRulesCount: firedCount };
  }
}
