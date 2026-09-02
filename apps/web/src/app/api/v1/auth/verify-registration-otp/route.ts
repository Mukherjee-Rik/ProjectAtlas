import { NextResponse } from 'next/server';
import {
  getRegChallenge,
  deleteRegChallenge,
  provisionRegisteredAccount,
} from '@/lib/auth-registration-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId, otp } = body || {};

    if (!challengeId || !otp) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID and 6-digit OTP code are required.' },
        { status: 400 },
      );
    }

    const challenge = getRegChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code has expired or is invalid. Please start registration again.',
        },
        { status: 401 },
      );
    }

    if (challenge.otp !== String(otp).trim()) {
      challenge.attempts += 1;
      if (challenge.attempts >= 5) {
        deleteRegChallenge(challengeId);
        return NextResponse.json(
          {
            success: false,
            error: 'Too many incorrect attempts. Please start registration again.',
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { success: false, error: 'Incorrect verification code. Please check and try again.' },
        { status: 401 },
      );
    }

    // Success -> Invalidate challenge
    deleteRegChallenge(challengeId);

    const userAgent = req.headers.get('user-agent') || undefined;
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      undefined;

    // Atomically provision the entire account & restaurant
    const result = await provisionRegisteredAccount(challenge, userAgent, ip);

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Verify Registration OTP Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to verify OTP code.' },
      { status: 500 },
    );
  }
}
