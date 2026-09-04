import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateReportScheduleDto } from '../dto/custom-report.dto';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(
    reportId: string,
    restaurantId: string,
    tenantId: string,
    dto: CreateReportScheduleDto,
  ) {
    const nextRunAt = this.calculateNextRun(
      dto.frequency,
      dto.timeOfDay || '09:00',
      dto.dayOfWeek,
      dto.dayOfMonth,
    );

    return this.prisma.reportSchedule.create({
      data: {
        tenantId,
        restaurantId,
        reportId,
        name: dto.name,
        frequency: dto.frequency,
        cronExpression: dto.cronExpression,
        timeOfDay: dto.timeOfDay || '09:00',
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        timezone: dto.timezone || 'Asia/Kolkata',
        recipients: dto.recipients as any,
        deliveryFormat: dto.deliveryFormat || 'CSV',
        enabled: dto.enabled ?? true,
        nextRunAt,
      },
    });
  }

  async listSchedules(restaurantId: string, reportId?: string) {
    const where: any = { restaurantId };
    if (reportId) where.reportId = reportId;

    return this.prisma.reportSchedule.findMany({
      where,
      include: {
        report: { select: { id: true, name: true, dataSource: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleSchedule(
    scheduleId: string,
    restaurantId: string,
    enabled: boolean,
  ) {
    const schedule = await this.prisma.reportSchedule.findFirst({
      where: { id: scheduleId, restaurantId },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    return this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: { enabled },
    });
  }

  async deleteSchedule(scheduleId: string, restaurantId: string) {
    const schedule = await this.prisma.reportSchedule.findFirst({
      where: { id: scheduleId, restaurantId },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    return this.prisma.reportSchedule.delete({ where: { id: scheduleId } });
  }

  private calculateNextRun(
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    timeOfDay: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
  ): Date {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);

    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (frequency === 'DAILY') {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === 'WEEKLY') {
      const targetDay = dayOfWeek ?? 1; // Default Monday
      const currentDay = next.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0 || (diff === 0 && next <= now)) diff += 7;
      next.setDate(next.getDate() + diff);
    } else if (frequency === 'MONTHLY') {
      const targetDate = dayOfMonth ?? 1;
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDate);
      }
    }

    return next;
  }
}
