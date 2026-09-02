import { NextResponse } from 'next/server';
import {
  getRegChallenge,
  generateOtp,
  maskEmail,
  sendRegistrationEmail,
} from '@/lib/auth-registration-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId } = body || {};

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required to resend verification code.' },
        { status: 400 },
      );
    }

    const challenge = getRegChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification session has expired. Please start registration again.',
        },
        { status: 401 },
      );
    }

    const newOtp = generateOtp();
    challenge.otp = newOtp;
    challenge.attempts = 0;
    challenge.expiresAt = Date.now() + 10 * 60 * 1000;

    console.log('=======================================================');
    console.log(`📲 [RESEND REGISTRATION OTP]`);
    console.log(`👤 Owner: ${challenge.ownerName} (${challenge.email})`);
    console.log(`🔑 New 6-Digit Code: >> [ ${newOtp} ] <<`);
    console.log(`⏰ Time: ${new Date().toISOString()} (Valid for 10 minutes)`);
    console.log('=======================================================');

    await sendRegistrationEmail(
      challenge.email,
      newOtp,
      challenge.ownerName,
      challenge.restaurantName,
    );

    return NextResponse.json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${maskEmail(challenge.email)}.`,
    });
  } catch (err: any) {
    console.error('[Resend Registration OTP Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to resend verification code.' },
      { status: 500 },
    );
  }
}
