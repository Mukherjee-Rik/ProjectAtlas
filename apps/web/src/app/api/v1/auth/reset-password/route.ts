import { NextResponse } from 'next/server';
import { getChallenge, deleteChallenge } from '@/lib/auth-recovery-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const challengeId = String(body?.challengeId || '').trim();
    const otp = String(body?.otp || '').trim();
    const newPassword = String(body?.newPassword || '').trim();

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required.' },
        { status: 400 },
      );
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter the full 6-digit verification code.' },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long.' },
        { status: 400 },
      );
    }

    const challenge = getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Reset session has expired or is invalid. Please request a new code.' },
        { status: 401 },
      );
    }

    if (challenge.otp !== otp) {
      challenge.attempts += 1;
      if (challenge.attempts >= 5) {
        deleteChallenge(challengeId);
        return NextResponse.json(
          { success: false, error: 'Too many incorrect attempts. Please request a new password reset.' },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { success: false, error: 'Incorrect verification code. Please check and try again.' },
        { status: 401 },
      );
    }

    // Success -> Invalidate challenge
    deleteChallenge(challengeId);

    console.log(`✅ [PASSWORD RESET] Success for ${challenge.identifier}`);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to reset password.' },
      { status: 500 },
    );
  }
}
