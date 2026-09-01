import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  senderName?: string;
  from?: string;
}

@Injectable()
export class EmailDispatcherService implements OnModuleInit {
  private readonly logger = new Logger(EmailDispatcherService.name);
  private transporter: Transporter | null = null;

  onModuleInit() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
      this.logger.log(`[EmailDispatcher] Configured authenticated SMTP transport for ${host}:${port} (${user})`);
    } else {
      this.logger.warn(
        `[EmailDispatcher] No SMTP credentials configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to deliver emails to real inboxes.`,
      );
    }
  }

  /**
   * Dispatches an email notification using Nodemailer authenticated SMTP transport.
   */
  async sendEmail(payload: Partial<EmailPayload> & { subject: string; html: string; text: string }): Promise<boolean> {
    const to = payload.to || process.env.DEFAULT_EMAIL_RECIPIENT || 'support@projectatlas.io';
    const senderName = (payload.senderName || process.env.SMTP_FROM_NAME || 'Kafei').replace(/["']/g, '').trim();
    const rawEmail = (payload.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'rikmukherjee21071999@gmail.com').trim();
    const emailMatch = rawEmail.match(/<([^>]+)>/);
    const cleanEmail = (emailMatch ? emailMatch[1] : rawEmail).replace(/["']/g, '').trim();
    const fromAddress = `"${senderName}" <${cleanEmail}>`;

    this.logger.log(`[EmailDispatcher] Dispatching "${payload.subject}" to ${to}`);

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          replyTo: payload.replyTo,
        });
        this.logger.log(`[EmailDispatcher] ✅ Successfully delivered via SMTP to ${to} (MessageId: ${info.messageId})`);
        return true;
      } catch (err: any) {
        this.logger.error(`[EmailDispatcher] ❌ SMTP delivery failed: ${err.message}`, err.stack);
        return false;
      }
    } else {
      this.logger.warn(
        `[EmailDispatcher] ⚠️ Email simulated (SMTP not configured in .env). Message to: ${to}, Subject: "${payload.subject}".`,
      );
      return true;
    }
  }
}
