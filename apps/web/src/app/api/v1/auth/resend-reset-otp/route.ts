import { NextResponse } from 'next/server';
import { getChallenge, generateOtp, maskEmail, sendPasswordResetEmail } from '@/lib/auth-recovery-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const challengeId = String(body?.challengeId || '').trim();

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required.' },
        { status: 400 },
      );
    }

    const challenge = getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Reset session expired. Please start over.' },
        { status: 401 },
      );
    }

    const newOtp = generateOtp();
    challenge.otp = newOtp;
    challenge.attempts = 0;
    challenge.expiresAt = Date.now() + 10 * 60 * 1000;

    console.log('=======================================================');
    console.log(`🔐 [RESEND RESET OTP] New Code: >> [ ${newOtp} ] << for ${challenge.email}`);
    console.log('=======================================================');

    await sendPasswordResetEmail(challenge.email, newOtp, challenge.userName);

    return NextResponse.json({
      success: true,
      message: `A new reset code has been sent to ${maskEmail(challenge.email)}.`,
    });
  } catch (err: any) {
    console.error('Resend reset OTP API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to resend reset code.' },
      { status: 500 },
    );
  }
}
