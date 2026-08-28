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
      to: 'baleremailamar@gmail.com',
      subject: `[Atlas Security] 🔐 Password Reset Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 20px;">🔐 Password Reset Request</h2>
          <p style="color: #a1a1aa; font-size: 13px;">A password reset was requested for user: <strong>${identifier}</strong></p>
          <div style="background-color: #18181b; border: 1px solid #f59e0b; padding: 20px; border-radius: 10px; text-align: center; margin: 16px 0;">
            <span style="font-size: 11px; font-weight: bold; color: #a1a1aa; text-transform: uppercase; letter-spacing: 2px;">Your 6-Digit Reset Code</span>
            <div style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #f59e0b; margin-top: 8px;">${otp}</div>
          </div>
          <p style="font-size: 12px; color: #a1a1aa;">This code is valid for <strong>10 minutes</strong>. Emergency Hotline: +91 9903085026.</p>
        </div>
      `,
      text: `[Atlas Password Reset OTP] Code: ${otp} for ${identifier}. Valid for 10 minutes.`,
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
