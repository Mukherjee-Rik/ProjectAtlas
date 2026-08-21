import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import crypto from 'node:crypto';

export class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  category?: 'TECHNICAL' | 'BILLING' | 'HARDWARE' | 'MENU_SETUP' | 'FEATURE_REQUEST';

  @IsOptional()
  @IsString()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class ResolveSupportTicketDto {
  @IsNotEmpty()
  @IsString()
  status: 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  generateTicketNumber(): string {
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `ATLAS-${randomHex}`;
  }

  async createTicket(userId: string | undefined, dto: CreateSupportTicketDto) {
    if (!dto.restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }
    if (!dto.subject || !dto.description) {
      throw new BadRequestException('Subject and description are required');
    }

    const ticketNumber = this.generateTicketNumber();

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        restaurantId: dto.restaurantId,
        userId: userId || null,
        category: dto.category || 'TECHNICAL',
        priority: dto.priority || 'NORMAL',
        status: 'OPEN',
        subject: dto.subject,
        description: dto.description,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
      },
    });
  }

  async getRestaurantTickets(restaurantId: string) {
    return this.prisma.supportTicket.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAdminTickets(status?: string, priority?: string) {
    return this.prisma.supportTicket.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveTicketForUser(ticketId: string, userId: string, role: string, dto: ResolveSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { restaurant: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    if (role !== 'PLATFORM_ADMIN') {
      const membership = await this.prisma.tenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: ticket.restaurant.tenantId,
          },
        },
      });
      if (!membership) {
        throw new NotFoundException(`Support ticket ${ticketId} not found`);
      }
    }

    return this.resolveTicket(ticketId, dto);
  }

  async resolveTicket(ticketId: string, dto: ResolveSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        ...(dto.resolutionNotes && { resolutionNotes: dto.resolutionNotes }),
        ...(dto.status === 'RESOLVED' || dto.status === 'CLOSED'
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
  }
}
