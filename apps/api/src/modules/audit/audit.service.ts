import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    actorUserId?: string;
    actorEmail?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    restaurantId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          actorEmail: data.actorEmail,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          restaurantId: data.restaurantId,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

  async getLogs(filters: {
    startDate?: string;
    endDate?: string;
    action?: string;
    restaurantId?: string;
    actorEmail?: string;
  }) {
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.restaurantId) where.restaurantId = filters.restaurantId;
    if (filters.actorEmail) {
      where.actorEmail = { contains: filters.actorEmail, mode: 'insensitive' };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
