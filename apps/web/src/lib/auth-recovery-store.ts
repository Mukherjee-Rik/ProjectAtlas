import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { buildKafeiEmailHtml } from './auth-registration-store';

export interface PasswordResetChallenge {
  userId: string;
  userName: string;
  identifier: string;
  email: string;
  phone: string | null;
  phoneMasked: string;
  emailMasked: string;
  otp: string;
  attempts: number;
  expiresAt: number;
}

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.koytepvphexiwrjjelai:Atla6Dev%401999@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10';

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    poolInstance.on('error', (err) =>
      console.warn('[Recovery Pool] Warning:', err.message),
    );
  }
  return poolInstance;
}

// Global in-memory storage across Next.js server invocations
const recoveryStore = new Map<string, PasswordResetChallenge>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const start = clean.substring(0, Math.min(clean.length - 4, 6));
  const end = clean.substring(clean.length - 4);
  return `${start}••••${end}`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : name;
  return `${maskedName}@${domain}`;
}

export function saveChallenge(challengeId: string, data: PasswordResetChallenge) {
  const now = Date.now();
  for (const [key, val] of recoveryStore.entries()) {
    if (val.expiresAt < now) recoveryStore.delete(key);
  }
  recoveryStore.set(challengeId, data);
}

export function getChallenge(challengeId: string): PasswordResetChallenge | undefined {
  const item = recoveryStore.get(challengeId);
  if (!item) return undefined;
  if (item.expiresAt < Date.now()) {
    recoveryStore.delete(challengeId);
    return undefined;
  }
  return item;
}

export function deleteChallenge(challengeId: string) {
  recoveryStore.delete(challengeId);
}

export async function findUserByIdentifier(identifier: string) {
  const pool = getPool();
  const raw = identifier.trim();
  const isEmail = raw.includes('@');

  if (isEmail) {
    const res = await pool.query(
      `SELECT id, name, email, phone, status FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [raw],
    );
    return res.rows[0] || null;
  } else {
    const cleanPhone = raw.replace(/[^0-9]/g, '');
    const res = await pool.query(
      `SELECT id, name, email, phone, status FROM users WHERE REPLACE(REPLACE(phone, ' ', ''), '+91', '') = $1 OR phone = $2 LIMIT 1`,
      [cleanPhone, raw],
    );
    return res.rows[0] || null;
  }
}

export async function sendPasswordResetEmail(toEmail: string, otp: string, userName?: string): Promise<boolean> {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = buildKafeiEmailHtml({
    title: 'Password Reset Request',
    greeting: `Hello ${userName || 'there'},`,
    description: 'We received a request to reset your password. Use the 6-digit code below to set a new password for your Kafei account.',
    otp,
    validityMinutes: 10,
    timestamp,
  });

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || 'rikmukherjee21071999@gmail.com';
  const pass = process.env.SMTP_PASS || 'gfgf vktd icgs qfvm';
  const senderName = (process.env.SMTP_FROM_NAME || 'Kafei Security').replace(/["']/g, '').trim();
  const cleanEmail = (process.env.SMTP_FROM_EMAIL || user).replace(/["']/g, '').trim();
  const fromAddress = `"${senderName}" <${cleanEmail}>`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your Kafei password reset code: ${otp}`,
      html,
      text: `Your Kafei password reset code is ${otp}. It is valid for 10 minutes.`,
    });
    console.log(`[Password Reset Email] Delivered OTP to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`[Password Reset Email Error]: ${err?.message}`, err);
    return false;
  }
}

export async function executePasswordReset(challengeId: string, otp: string, newPassword: string) {
  const challenge = getChallenge(challengeId);
  if (!challenge) {
    throw new Error('Reset session has expired or is invalid. Please request a new code.');
  }

  if (challenge.otp !== otp.trim()) {
    challenge.attempts += 1;
    if (challenge.attempts >= 5) {
      deleteChallenge(challengeId);
      throw new Error('Too many incorrect attempts. Please request a new password reset.');
    }
    throw new Error('Incorrect verification code. Please check and try again.');
  }

  deleteChallenge(challengeId);

  const pool = getPool();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  await pool.query(
    `UPDATE users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [passwordHash, challenge.userId],
  );

  // Invalidate old sessions
  try {
    await pool.query(`DELETE FROM sessions WHERE "userId" = $1`, [challenge.userId]);
  } catch (sessErr) {
    console.warn('[Password Reset] failed to purge old sessions:', sessErr);
  }

  return { success: true, message: 'Your password has been reset successfully. Please log in with your new password.' };
}
