import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  generateOtp,
  maskPhone,
  maskEmail,
  saveChallenge,
  findUserByIdentifier,
  sendPasswordResetEmail,
} from '@/lib/auth-recovery-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = String(body?.identifier || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Please provide your registered email address or phone number.' },
        { status: 400 },
      );
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found matching the provided email or phone.' },
        { status: 404 },
      );
    }

    const otp = generateOtp();
    const challengeId = `pwd_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const userPhone = user.phone || '9903085026';
    const userEmail = user.email.toLowerCase();

    // Store in recovery store for 10 minutes
    saveChallenge(challengeId, {
      userId: user.id,
      userName: user.name || 'Kafei User',
      identifier,
      email: userEmail,
      phone: user.phone || null,
      phoneMasked: maskPhone(userPhone),
      emailMasked: maskEmail(userEmail),
      otp,
      attempts: 0,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log('=======================================================');
    console.log(`🔐 [SECURITY ALERT] PASSWORD RESET OTP DISPATCH`);
    console.log(`👤 User: ${user.name} (${userEmail})`);
    console.log(`📱 Phone: +91 ${userPhone}`);
    console.log(`🔑 6-Digit Reset Code: >> [ ${otp} ] <<`);
    console.log(`⏰ Time: ${new Date().toISOString()} (Valid for 10 minutes)`);
    console.log('=======================================================');

    // Await delivery via authenticated SMTP
    await sendPasswordResetEmail(userEmail, otp, user.name);

    return NextResponse.json({
      success: true,
      challengeId,
      phoneMasked: maskPhone(userPhone),
      emailMasked: maskEmail(userEmail),
      message: `A 6-digit password reset code has been sent to ${maskEmail(userEmail)}.`,
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to process password reset request.' },
      { status: 500 },
    );
  }
}
