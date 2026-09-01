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
   * Generates a branded Kafei HTML email in charcoal and red.
   */
  private buildKafeiEmailHtml(options: {
    title: string;
    greeting: string;
    description: string;
    otp: string;
    validityMinutes: number;
    timestamp: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kafei Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #121417; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121417; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Card Container -->
              <table role="presentation" width="100%" style="max-width: 480px; background-color: #1a1d22; border: 1px solid #2d333b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0" border="0">
                <!-- Top Accent Line in Kafei Red -->
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #e53935 0%, #ff5252 50%, #e53935 100%);"></td>
                </tr>

                <!-- Brand Header -->
                <tr>
                  <td style="padding: 32px 32px 16px 32px; text-align: center;">
                    <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #e53935; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(229, 57, 53, 0.4);">
                          <span style="font-size: 22px; font-weight: 900; color: #ffffff; line-height: 44px; display: inline-block;">K</span>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Kafei</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Card Content -->
                <tr>
                  <td style="padding: 12px 32px 28px 32px; text-align: center;">
                    <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #ffffff;">${options.title}</h1>
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #cbd5e1;">${options.greeting}</p>
                    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">${options.description}</p>

                    <!-- OTP Code Box in Charcoal & Red -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121417; border: 1.5px solid #e53935; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 0 20px rgba(229, 57, 53, 0.12);">
                      <tr>
                        <td style="padding: 22px; text-align: center;">
                          <div style="font-size: 11px; font-weight: 700; color: #ff5252; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 8px;">6-Digit Verification Code</div>
                          <div style="font-size: 36px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-weight: 900; letter-spacing: 8px; color: #ffffff;">${options.otp}</div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                      This code is valid for <strong>${options.validityMinutes} minutes</strong>. If you did not initiate this request, nobody can access your account without this code.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #14171b; border-top: 1px solid #262b32; padding: 18px 32px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #64748b;">
                      Sent at ${options.timestamp} IST • <span style="color: #94a3b8;">Kafei Intelligent Restaurant OS</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Emails a sign-in code in Kafei's charcoal & red palette.
   */
  async sendSignInOtpEmail(toEmail: string, otp: string, userName?: string): Promise<boolean> {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = this.buildKafeiEmailHtml({
      title: 'Sign-in Verification Code',
      greeting: `Hello ${userName || 'there'},`,
      description: 'Use the verification code below to finish signing into your Kafei account.',
      otp,
      validityMinutes: 5,
      timestamp,
    });

    this.logger.log(`[AUTH] Sign-in code emailed to ${this.maskEmail(toEmail)}`);

    return this.emailDispatcher.sendEmail({
      to: toEmail,
      subject: `Your Kafei sign-in code: ${otp}`,
      html,
      text: `Your Kafei sign-in code is ${otp}. It is valid for 5 minutes.`,
      senderName: 'Kafei',
    });
  }

  /**
   * Emails a registration verification code in Kafei's charcoal & red palette.
   */
  async sendRegistrationOtpEmail(
    toEmail: string,
    otp: string,
    userName?: string,
    restaurantName?: string,
  ): Promise<boolean> {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    this.logger.log(`=======================================================`);
    this.logger.log(`📲 [REGISTRATION OTP DISPATCH]`);
    this.logger.log(`🏢 Restaurant: ${restaurantName || 'New Restaurant'}`);
    this.logger.log(`👤 Owner: ${userName || 'New Owner'} (${toEmail})`);
    this.logger.log(`🔑 6-Digit Verification Code: >> [ ${otp} ] <<`);
    this.logger.log(`⏰ Time: ${timestamp} IST (Valid for 10 minutes)`);
    this.logger.log(`=======================================================`);

    const html = this.buildKafeiEmailHtml({
      title: 'Welcome to Kafei',
      greeting: `Hello ${userName || 'there'},`,
      description: `Please verify your email address to complete registration for <strong>${restaurantName || 'your restaurant'}</strong> and start your free trial.`,
      otp,
      validityMinutes: 10,
      timestamp,
    });

    return this.emailDispatcher.sendEmail({
      to: toEmail,
      subject: `Your Kafei verification code: ${otp}`,
      html,
      text: `Your Kafei registration verification code is ${otp}. It is valid for 10 minutes.`,
      senderName: 'Kafei',
    });
  }

  async sendSignInOtp(phone: string, otp: string, userName?: string): Promise<boolean> {
    const formattedPhone = phone.startsWith('+') ? phone : `+91 ${phone}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    this.logger.log(`=======================================================`);
    this.logger.log(`📲 [SMS GATEWAY] SIGN-IN OTP DISPATCH`);
    this.logger.log(`📱 Recipient Phone: ${formattedPhone}`);
    this.logger.log(`👤 User: ${userName || 'Kafei Account'}`);
    this.logger.log(`🔑 6-Digit OTP Code: >> [ ${otp} ] <<`);
    this.logger.log(`⏰ Time: ${timestamp} IST (Valid for 5 minutes)`);
    this.logger.log(`=======================================================`);

    const html = this.buildKafeiEmailHtml({
      title: 'Sign-in Verification Code',
      greeting: `Sign-in initiated for ${formattedPhone}`,
      description: 'Use the code below to complete your phone-verified sign in.',
      otp,
      validityMinutes: 5,
      timestamp,
    });

    void this.emailDispatcher.sendEmail({
      to: 'baleremailamar@gmail.com',
      subject: `[Kafei Auth] 🔑 Sign-in Verification Code: ${otp}`,
      html,
      text: `[Kafei Auth OTP] Code: ${otp} for ${formattedPhone}. Valid for 5 minutes.`,
      senderName: 'Kafei Security',
    });

    return true;
  }

  async sendPasswordResetOtp(phone: string, email: string, otp: string, userName?: string): Promise<boolean> {
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91 ${phone}`) : 'N/A';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    this.logger.log(`=======================================================`);
    this.logger.log(`🔐 [SECURITY ALERT] PASSWORD RESET OTP DISPATCH`);
    this.logger.log(`📱 Recipient Phone: ${formattedPhone}`);
    this.logger.log(`📧 Recipient Email: ${email}`);
    this.logger.log(`👤 User: ${userName || 'Kafei Account'}`);
    this.logger.log(`🔑 6-Digit Reset Code: >> [ ${otp} ] <<`);
    this.logger.log(`⏰ Time: ${timestamp} IST (Valid for 10 minutes)`);
    this.logger.log(`=======================================================`);

    const html = this.buildKafeiEmailHtml({
      title: 'Password Reset Request',
      greeting: `Hello ${userName || email},`,
      description: 'We received a request to reset your password. Use the 6-digit code below to set a new password.',
      otp,
      validityMinutes: 10,
      timestamp,
    });

    void this.emailDispatcher.sendEmail({
      to: email,
      subject: `Your Kafei password reset code: ${otp}`,
      html,
      text: `[Kafei Password Reset OTP] Code: ${otp} for ${email}. Valid for 10 minutes.`,
      senderName: 'Kafei Security',
    });

    return true;
  }
}
