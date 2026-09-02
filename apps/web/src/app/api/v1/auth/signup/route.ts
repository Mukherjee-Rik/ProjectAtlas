import { NextResponse } from 'next/server';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import {
  generateOtp,
  maskEmail,
  saveRegChallenge,
  sendRegistrationEmail,
  getRegPool,
} from '@/lib/auth-registration-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantName, ownerName, email, phone, password } = body || {};

    if (!restaurantName || !ownerName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required registration fields.' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if email already registered in DB
    const pool = getRegPool();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email address is already registered. Please sign in.' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const challengeId = `reg_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    // Store in challenge store for 10 minutes
    saveRegChallenge(challengeId, {
      restaurantName: String(restaurantName).trim(),
      ownerName: String(ownerName).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      passwordHash,
      otp,
      attempts: 0,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log('=======================================================');
    console.log(`📲 [REGISTRATION OTP DISPATCH]`);
    console.log(`🏢 Restaurant: ${restaurantName}`);
    console.log(`👤 Owner: ${ownerName} (${normalizedEmail})`);
    console.log(`🔑 6-Digit Verification Code: >> [ ${otp} ] <<`);
    console.log(`⏰ Time: ${new Date().toISOString()} (Valid for 10 minutes)`);
    console.log('=======================================================');

    // Dispatch branded email via authenticated SMTP
    void sendRegistrationEmail(
      normalizedEmail,
      otp,
      String(ownerName).trim(),
      String(restaurantName).trim(),
    );

    return NextResponse.json({
      success: true,
      data: {
        otpRequired: true,
        challengeId,
        emailMasked: maskEmail(normalizedEmail),
        message: `We sent a 6-digit verification code to ${maskEmail(normalizedEmail)}. It is valid for 10 minutes.`,
      },
    });
  } catch (err: any) {
    console.error('[Signup Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to initiate registration.' },
      { status: 500 },
    );
  }
}
