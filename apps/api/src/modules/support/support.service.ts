import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import crypto from 'node:crypto';
import { EmailDispatcherService } from './email-dispatcher.service';

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

export class ContactInquiryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  restaurantName?: string;

  @IsOptional()
  @IsString()
  inquiryType?: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly notificationRecipient = 'baleremailamar@gmail.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatcher: EmailDispatcherService,
  ) {}

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

    const ticket = await this.prisma.supportTicket.create({
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
      include: {
        restaurant: {
          select: { id: true, name: true },
        },
      },
    });

    // Send instant email notification to baleremailamar@gmail.com
    const emailSubject = `[Atlas Support - ${ticket.priority}] ${ticket.ticketNumber}: ${ticket.subject}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 600px;">
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #34d399; margin: 0 0 4px 0; font-size: 20px;">🆘 New Support Ticket Filed</h2>
          <p style="color: #a1a1aa; margin: 0; font-size: 13px;">Reference Code: <strong style="color: #ffffff;">${ticket.ticketNumber}</strong></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa; width: 140px;">Restaurant:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${ticket.restaurant?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Priority:</td>
            <td style="padding: 8px 0; color: ${ticket.priority === 'URGENT' ? '#ef4444' : '#34d399'}; font-weight: bold;">${ticket.priority}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Category:</td>
            <td style="padding: 8px 0; color: #ffffff;">${ticket.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Contact Email:</td>
            <td style="padding: 8px 0; color: #38bdf8;">${ticket.contactEmail || 'None provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Contact Phone:</td>
            <td style="padding: 8px 0; color: #34d399; font-weight: bold;">${ticket.contactPhone || 'None provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Subject:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${ticket.subject}</td>
          </tr>
        </table>

        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; margin-bottom: 8px;">Description & Incident Details</div>
          <div style="font-size: 13px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${ticket.description}</div>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
          Project Atlas Automated Support System • Direct Hotline: +91 9903085026
        </div>
      </div>
    `;

    const emailText = `
[NEW SUPPORT TICKET] ${ticket.ticketNumber}
Restaurant: ${ticket.restaurant?.name || 'N/A'}
Priority: ${ticket.priority}
Category: ${ticket.category}
Subject: ${ticket.subject}
Contact Email: ${ticket.contactEmail || 'N/A'}
Contact Phone: ${ticket.contactPhone || 'N/A'}

Details:
${ticket.description}
    `.trim();

    void this.emailDispatcher.sendEmail({
      to: this.notificationRecipient,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      replyTo: ticket.contactEmail || undefined,
      senderName: 'Atlas Support Desk',
    });

    return ticket;
  }

  async handleContactInquiry(dto: ContactInquiryDto) {
    const referenceCode = `INQ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    this.logger.log(`[SupportService] Contact inquiry received (${referenceCode}) from ${dto.name} (${dto.email})`);

    const emailSubject = `[Atlas Contact/Inquiry] ${dto.inquiryType || 'General'}: ${dto.subject || dto.name} (${referenceCode})`;
    
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 600px;">
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #34d399; margin: 0 0 4px 0; font-size: 20px;">💬 New Contact / Talk to Us Message</h2>
          <p style="color: #a1a1aa; margin: 0; font-size: 13px;">Reference Code: <strong style="color: #ffffff;">${referenceCode}</strong> • Received: ${timestamp} IST</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa; width: 140px;">Sender Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${dto.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Email Address:</td>
            <td style="padding: 8px 0; color: #38bdf8; font-weight: bold;"><a href="mailto:${dto.email}" style="color: #38bdf8; text-decoration: none;">${dto.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Phone Number:</td>
            <td style="padding: 8px 0; color: #34d399; font-weight: bold;"><a href="tel:${dto.phone}" style="color: #34d399; text-decoration: none;">${dto.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Restaurant / Brand:</td>
            <td style="padding: 8px 0; color: #ffffff;">${dto.restaurantName || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Inquiry Category:</td>
            <td style="padding: 8px 0; color: #e4e4e7;">${dto.inquiryType || 'General Inquiry'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Subject:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${dto.subject}</td>
          </tr>
        </table>

        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; margin-bottom: 8px;">Message Content</div>
          <div style="font-size: 13px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${dto.message}</div>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
          Project Atlas Contact Service • Direct Phone: +91 9903085026 • Email: baleremailamar@gmail.com
        </div>
      </div>
    `;

    const emailText = `
[NEW CONTACT INQUIRY - ${referenceCode}]
From: ${dto.name}
Email: ${dto.email}
Phone: ${dto.phone}
Restaurant/Brand: ${dto.restaurantName || 'N/A'}
Inquiry Type: ${dto.inquiryType || 'General'}
Subject: ${dto.subject}

Message:
${dto.message}
    `.trim();

    void this.emailDispatcher.sendEmail({
      to: this.notificationRecipient,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      replyTo: dto.email,
      senderName: dto.name,
    });

    return {
      success: true,
      referenceCode,
      message: 'Your inquiry has been received. Our team will contact you shortly.',
    };
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
