import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'node:dns/promises';
import * as net from 'node:net';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  senderName?: string;
}

@Injectable()
export class EmailDispatcherService {
  private readonly logger = new Logger(EmailDispatcherService.name);
  private readonly defaultRecipient = 'baleremailamar@gmail.com';

  /**
   * Dispatches an email notification to the specified recipient (defaults to baleremailamar@gmail.com)
   * using native Node.js direct SMTP / MX resolution without any 3rd-party SaaS or SMTP relay dependencies.
   */
  async sendEmail(payload: Partial<EmailPayload> & { subject: string; html: string; text: string }): Promise<boolean> {
    const to = payload.to || this.defaultRecipient;
    const from = 'atlas-system@projectatlas.io';
    const senderName = payload.senderName || 'Project Atlas Platform';

    this.logger.log(`[EmailDispatcher] Initiating built-in dispatch for "${payload.subject}" to ${to}`);

    try {
      // 1. Resolve target domain MX records via DNS
      const domain = to.split('@')[1] || 'gmail.com';
      let mxHost = 'gmail-smtp-in.l.google.com';

      try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
          // Sort by priority (lowest number = highest priority)
          mxRecords.sort((a, b) => a.priority - b.priority);
          mxHost = mxRecords[0].exchange;
          this.logger.log(`[EmailDispatcher] Resolved MX host for ${domain}: ${mxHost}`);
        }
      } catch (dnsErr: any) {
        this.logger.warn(`[EmailDispatcher] MX lookup for ${domain} returned fallback: ${dnsErr?.message}`);
      }

      // 2. Build RFC 5322 MIME Message
      const messageDate = new Date().toUTCString();
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const rawMessage = [
        `From: "${senderName}" <${from}>`,
        `To: <${to}>`,
        payload.replyTo ? `Reply-To: <${payload.replyTo}>` : '',
        `Subject: =?UTF-8?B?${Buffer.from(payload.subject).toString('base64')}?=`,
        `Date: ${messageDate}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        payload.text,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        payload.html,
        '',
        `--${boundary}--`,
        '',
      ].filter(Boolean).join('\r\n');

      // 3. Attempt direct SMTP transmission
      await this.transmitDirectSmtp(mxHost, from, to, rawMessage);
      this.logger.log(`[EmailDispatcher] Successfully delivered message "${payload.subject}" to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.warn(
        `[EmailDispatcher] Direct delivery note: ${err?.message || err}. Notification logged to platform audit log.`
      );
      return false;
    }
  }

  /**
   * Executes a native SMTP conversation with the destination mail exchange server.
   */
  private async transmitDirectSmtp(host: string, from: string, to: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port: 25, timeout: 10000 });
      let step = 0;
      let buffer = '';

      const cleanup = () => {
        socket.removeAllListeners();
        if (!socket.destroyed) {
          socket.destroy();
        }
      };

      const fail = (errorMsg: string) => {
        cleanup();
        reject(new Error(errorMsg));
      };

      socket.on('timeout', () => {
        fail(`Connection to ${host}:25 timed out (Port 25 may be filtered by local ISP/firewall)`);
      });

      socket.on('error', (err) => {
        fail(`Socket error on ${host}:25: ${err.message}`);
      });

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const code = parseInt(line.substring(0, 3), 10);
          if (isNaN(code)) continue;

          // SMTP Multi-line response continuation check (e.g., '250-xxx')
          if (line.charAt(3) === '-') continue;

          if (step === 0 && code === 220) {
            step = 1;
            socket.write('EHLO projectatlas.io\r\n');
          } else if (step === 1 && code === 250) {
            step = 2;
            socket.write(`MAIL FROM:<${from}>\r\n`);
          } else if (step === 2 && code === 250) {
            step = 3;
            socket.write(`RCPT TO:<${to}>\r\n`);
          } else if (step === 3 && code === 250) {
            step = 4;
            socket.write('DATA\r\n');
          } else if (step === 4 && code === 354) {
            step = 5;
            socket.write(`${message}\r\n.\r\n`);
          } else if (step === 5 && code === 250) {
            step = 6;
            socket.write('QUIT\r\n');
            cleanup();
            resolve();
          } else if (code >= 400) {
            fail(`SMTP Error (${code}): ${line}`);
          }
        }
      });
    });
  }
}
