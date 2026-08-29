import { Injectable, Logger } from '@nestjs/common';
import { EmailDispatcherService } from '../support/email-dispatcher.service';

@Injectable()
export class SmsDispatcherService {
  private readonly logger = new Logger(SmsDispatcherService.name);

  constructor(private readonly emailDispatcher: EmailDispatcherService) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  maskPhone(phone: string): string {
    const clean = phone.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    const start = clean.substring(0, Math.min(clean.length - 4, 6));
    const end = clean.substring(clean.length - 4);
    return `${start}••••${end}`;
  }

  maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : name;
    return `${maskedName}@${domain}`;
  }

  /**
   * Emails a sign-in code to the account holder's own address.
   *
   * Distinct from sendSignInOtp, which frames the code as an SMS and copies a
   * fixed operations mailbox — fine as an internal notice, wrong for delivering
   * a factor to the person signing in. This one only ever writes to the user's
   * address.
   */
  async sendSignInOtpEmail(toEmail: string, otp: string, userName?: string): Promise<boolean> {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #f4f4f5; margin: 0 0 8px 0; font-size: 20px;">Your Kafei sign-in code</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 20px 0;">Hello ${userName || 'there'} — use this code to finish signing in.</p>

        <div style="background-color: #18181b; border: 1px solid #3f3f46; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px;">6-digit code</span>
          <div style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #ffffff; margin-top: 8px;">${otp}</div>
        </div>

        <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">This code is valid for <strong>5 minutes</strong>. If you did not try to sign in, you can ignore this email — nobody can get in without the code.</p>
        <div style="border-top: 1px solid #27272a; margin-top: 16px; padding-top: 12px; font-size: 11px; color: #71717a;">Sent ${timestamp} IST</div>
      </div>
    `;

    this.logger.log(`[AUTH] Sign-in code emailed to ${this.maskEmail(toEmail)}`);

    return this.emailDispatcher.sendEmail({
      to: toEmail,
      subject: `Your Kafei sign-in code: ${otp}`,
      html,
      text: `Your Kafei sign-in code is ${otp}. It is valid for 5 minutes.`,
      senderName: 'Kafei',
    });
  }

  async sendSignInOtp(phone: string, otp: string, userName?: string): Promise<boolean> {
    const formattedPhone = phone.startsWith('+') ? phone : `+91 ${phone}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // 1. Log prominently in system logs & terminal
    this.logger.log(`=======================================================`);
    this.logger.log(`📲 [SMS GATEWAY] SIGN-IN OTP DISPATCH`);
    this.logger.log(`📱 Recipient Phone: ${formattedPhone}`);
    this.logger.log(`👤 User: ${userName || 'Atlas Account'}`);
    this.logger.log(`🔑 6-Digit OTP Code: >> [ ${otp} ] <<`);
    this.logger.log(`⏰ Time: ${timestamp} IST (Valid for 5 minutes)`);
    this.logger.log(`=======================================================`);

    // 2. Dispatch backup email notification to baleremailamar@gmail.com
    const emailSubject = `[Atlas Auth] 🔑 Sign-in Verification Code: ${otp} for ${formattedPhone}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #34d399; margin: 0 0 8px 0; font-size: 20px;">🔑 Atlas Sign-in OTP Verification</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 20px 0;">A sign-in request was initiated for phone: <strong style="color: #ffffff;">${formattedPhone}</strong></p>

        <div style="background-color: #18181b; border: 1px solid #34d399; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px;">Your 6-Digit Code</span>
          <div style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #34d399; margin-top: 8px;">${otp}</div>
        </div>

        <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">This verification code is valid for <strong>5 minutes</strong>. If you did not request this code, please secure your account.</p>
        <div style="border-top: 1px solid #27272a; margin-top: 16px; padding-top: 12px; font-size: 11px; color: #71717a; text-align: center;">
          Project Atlas Security Desk • Direct Hotline: +91 9903085026
        </div>
      </div>
    `;

    const emailText = `[Atlas Auth OTP] Code: ${otp} for ${formattedPhone}. Valid for 5 minutes.`;

    void this.emailDispatcher.sendEmail({
      to: 'baleremailamar@gmail.com',
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      senderName: 'Atlas Security',
    });

    return true;
  }

  async sendPasswordResetOtp(phone: string, email: string, otp: string, userName?: string): Promise<boolean> {
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91 ${phone}`) : 'N/A';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // 1. Log prominently in system logs & terminal
    this.logger.log(`=======================================================`);
    this.logger.log(`🔐 [SECURITY ALERT] PASSWORD RESET OTP DISPATCH`);
    this.logger.log(`📱 Recipient Phone: ${formattedPhone}`);
    this.logger.log(`📧 Recipient Email: ${email}`);
    this.logger.log(`👤 User: ${userName || 'Atlas Account'}`);
    this.logger.log(`🔑 6-Digit Reset Code: >> [ ${otp} ] <<`);
    this.logger.log(`⏰ Time: ${timestamp} IST (Valid for 10 minutes)`);
    this.logger.log(`=======================================================`);

    // 2. Dispatch backup email notification to baleremailamar@gmail.com
    const emailSubject = `[Atlas Security] 🔐 Password Reset Code: ${otp}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 20px;">🔐 Password Reset Request</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 20px 0;">A password reset was requested for user: <strong style="color: #ffffff;">${userName || email}</strong></p>

        <div style="background-color: #18181b; border: 1px solid #f59e0b; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px;">Your 6-Digit Reset Code</span>
          <div style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #f59e0b; margin-top: 8px;">${otp}</div>
        </div>

        <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">This password reset code is valid for <strong>10 minutes</strong>. If you did not initiate this request, please contact support immediately.</p>
        <div style="border-top: 1px solid #27272a; margin-top: 16px; padding-top: 12px; font-size: 11px; color: #71717a; text-align: center;">
          Project Atlas Security Desk • Direct Hotline: +91 9903085026
        </div>
      </div>
    `;

    const emailText = `[Atlas Password Reset OTP] Code: ${otp} for ${email}. Valid for 10 minutes.`;

    void this.emailDispatcher.sendEmail({
      to: 'baleremailamar@gmail.com',
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      senderName: 'Atlas Security',
    });

    return true;
  }
}
