import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class AutomationRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, userId: string, data: {
    name: string;
    description?: string;
    triggerType: string;
    schedule?: string;
    eventType?: string;
    conditionType?: string;
    conditionValue?: number;
    actionType: string;
    cooldownMinutes?: number;
  }) {
    return this.prisma.automationRule.create({
      data: {
        restaurantId,
        createdBy: userId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        schedule: data.schedule,
        eventType: data.eventType,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue,
        actionType: data.actionType,
        cooldownMinutes: data.cooldownMinutes ?? 360,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.automationRule.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { executions: true } },
      },
    });
  }

  async findById(id: string, restaurantId: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id, restaurantId },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  async update(id: string, restaurantId: string, data: {
    name?: string;
    description?: string;
    enabled?: boolean;
    schedule?: string;
    conditionType?: string;
    conditionValue?: number;
    actionType?: string;
    cooldownMinutes?: number;
  }) {
    await this.findById(id, restaurantId);
    return this.prisma.automationRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, restaurantId: string) {
    await this.findById(id, restaurantId);
    return this.prisma.automationRule.delete({ where: { id } });
  }

  async getExecutions(id: string, restaurantId: string, limit = 20) {
    await this.findById(id, restaurantId);
    return this.prisma.automationExecution.findMany({
      where: { automationId: id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
