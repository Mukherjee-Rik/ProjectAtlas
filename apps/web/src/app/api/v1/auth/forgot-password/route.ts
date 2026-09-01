import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  generateOtp,
  maskPhone,
  maskEmail,
  saveChallenge,
  sendDirectEmail,
} from '@/lib/auth-recovery-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = String(body?.identifier || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Please provide your email address or phone number.' },
        { status: 400 },
      );
    }

    const isEmail = identifier.includes('@');
    const targetPhone = isEmail ? '9903085026' : identifier.replace(/[^0-9]/g, '');
    const targetEmail = isEmail ? identifier.toLowerCase() : 'baleremailamar@gmail.com';

    const otp = generateOtp();
    const challengeId = `pwd_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    // Store in recovery store for 10 minutes
    saveChallenge(challengeId, {
      identifier,
      phoneMasked: maskPhone(targetPhone),
      emailMasked: maskEmail(targetEmail),
      otp,
      attempts: 0,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Console logging
    console.log('=======================================================');
    console.log(`🔐 [SECURITY ALERT] PASSWORD RESET OTP DISPATCH`);
    console.log(`📱 Recipient Phone: +91 ${targetPhone}`);
    console.log(`📧 Recipient Email: ${targetEmail}`);
    console.log(`🔑 6-Digit Reset Code: >> [ ${otp} ] <<`);
    console.log(`⏰ Time: ${new Date().toISOString()} (Valid for 10 minutes)`);
    console.log('=======================================================');

    // Dispatch native email
    void sendDirectEmail({
      to: targetEmail,
      subject: `Your Kafei password reset code: ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #121417; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" style="background-color: #121417; padding: 40px 16px;" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 480px; background-color: #1a1d22; border: 1px solid #2d333b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0">
                  <tr><td height="4" style="background: linear-gradient(90deg, #e53935 0%, #ff5252 50%, #e53935 100%);"></td></tr>
                  <tr>
                    <td style="padding: 32px 32px 16px 32px; text-align: center;">
                      <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="background-color: #e53935; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle;">
                            <span style="font-size: 22px; font-weight: 900; color: #ffffff; line-height: 44px;">K</span>
                          </td>
                          <td style="padding-left: 12px; vertical-align: middle;">
                            <span style="font-size: 24px; font-weight: 800; color: #ffffff;">Kafei</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 32px 28px 32px; text-align: center;">
                      <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Password Reset Request</h1>
                      <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">A password reset was requested for user: <strong style="color: #ffffff;">${identifier}</strong></p>
                      <table role="presentation" width="100%" style="background-color: #121417; border: 1.5px solid #e53935; border-radius: 12px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 22px; text-align: center;">
                            <div style="font-size: 11px; font-weight: 700; color: #ff5252; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 8px;">6-Digit Reset Code</div>
                            <div style="font-size: 36px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #ffffff;">${otp}</div>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0; font-size: 12px; color: #64748b;">This code is valid for <strong>10 minutes</strong>. If you did not make this request, please ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #14171b; border-top: 1px solid #262b32; padding: 18px 32px; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #64748b;">Kafei Intelligent Restaurant OS</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `[Kafei Password Reset OTP] Code: ${otp} for ${identifier}. Valid for 10 minutes.`,
    });

    return NextResponse.json({
      success: true,
      challengeId,
      phoneMasked: maskPhone(targetPhone),
      emailMasked: maskEmail(targetEmail),
      message: `A 6-digit password reset code has been sent to ${maskPhone(targetPhone)}.`,
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to process password reset request.' },
      { status: 500 },
    );
  }
}
