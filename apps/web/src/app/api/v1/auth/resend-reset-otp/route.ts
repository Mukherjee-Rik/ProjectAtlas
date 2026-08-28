import { NextResponse } from 'next/server';
import { getChallenge, generateOtp, sendDirectEmail } from '@/lib/auth-recovery-store';

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
    console.log(`🔐 [RESEND RESET OTP] New Code: >> [ ${newOtp} ] << for ${challenge.identifier}`);
    console.log('=======================================================');

    void sendDirectEmail({
      to: 'baleremailamar@gmail.com',
      subject: `[Atlas Security] 🔐 New Password Reset Code: ${newOtp}`,
      html: `
        <div style="font-family: sans-serif; background-color: #0c0d12; color: #f4f4f5; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 20px;">🔐 New Password Reset Code</h2>
          <div style="background-color: #18181b; border: 1px solid #f59e0b; padding: 20px; border-radius: 10px; text-align: center; margin: 16px 0;">
            <div style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #f59e0b;">${newOtp}</div>
          </div>
        </div>
      `,
      text: `[Atlas Password Reset OTP] New Code: ${newOtp} for ${challenge.identifier}.`,
    });

    return NextResponse.json({
      success: true,
      message: `A new reset code has been sent to ${challenge.phoneMasked}.`,
    });
  } catch (err: any) {
    console.error('Resend reset OTP API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unable to resend reset code.' },
      { status: 500 },
    );
  }
}
