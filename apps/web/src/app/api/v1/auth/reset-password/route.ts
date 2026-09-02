import { NextResponse } from 'next/server';
import { executePasswordReset } from '@/lib/auth-recovery-store';

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

    const result = await executePasswordReset(challengeId, otp, newPassword);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to reset password.' },
      { status: 400 },
    );
  }
}
