import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    restaurantId: string;
    userId?: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({ data });
  }

  async getForUser(restaurantId: string, userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: {
        restaurantId,
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(restaurantId: string, userId: string) {
    return this.prisma.notification.count({
      where: {
        restaurantId,
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, restaurantId: string) {
    return this.prisma.notification.updateMany({
      where: { id, restaurantId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(restaurantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        restaurantId,
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}
