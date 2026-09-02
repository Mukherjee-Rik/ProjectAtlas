import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Pool, type PoolClient } from 'pg';
import * as nodemailer from 'nodemailer';

export interface RegistrationChallenge {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  otp: string;
  attempts: number;
  expiresAt: number;
}

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.koytepvphexiwrjjelai:Atla6Dev%401999@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744';

let regPool: Pool | null = null;

export function getRegPool(): Pool {
  if (!regPool) {
    regPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    regPool.on('error', (err) =>
      console.warn('[Registration Pool] Warning:', err.message),
    );
  }
  return regPool;
}

// In-memory challenge store
const challengeStore = new Map<string, RegistrationChallenge>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : name;
  return `${maskedName}@${domain}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const start = clean.substring(0, Math.min(clean.length - 4, 6));
  const end = clean.substring(clean.length - 4);
  return `${start}••••${end}`;
}

export function saveRegChallenge(challengeId: string, data: RegistrationChallenge) {
  const now = Date.now();
  for (const [key, val] of challengeStore.entries()) {
    if (val.expiresAt < now) challengeStore.delete(key);
  }
  challengeStore.set(challengeId, data);
}

export function getRegChallenge(challengeId: string): RegistrationChallenge | undefined {
  const item = challengeStore.get(challengeId);
  if (!item) return undefined;
  if (item.expiresAt < Date.now()) {
    challengeStore.delete(challengeId);
    return undefined;
  }
  return item;
}

export function deleteRegChallenge(challengeId: string) {
  challengeStore.delete(challengeId);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'restaurant'
  );
}

export function buildKafeiEmailHtml(options: {
  title: string;
  greeting: string;
  description: string;
  otp: string;
  validityMinutes: number;
  timestamp: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kafei Verification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #121417; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121417; padding: 40px 16px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table role="presentation" width="100%" style="max-width: 480px; background-color: #1a1d22; border: 1px solid #2d333b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0" border="0">
              <!-- Top Accent Line in Kafei Red -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #e53935 0%, #ff5252 50%, #e53935 100%);"></td>
              </tr>

              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 16px 32px; text-align: center;">
                  <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color: #e53935; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(229, 57, 53, 0.4);">
                        <span style="font-size: 22px; font-weight: 900; color: #ffffff; line-height: 44px; display: inline-block;">K</span>
                      </td>
                      <td style="padding-left: 12px; vertical-align: middle;">
                        <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Kafei</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Card Content -->
              <tr>
                <td style="padding: 12px 32px 28px 32px; text-align: center;">
                  <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #ffffff;">${options.title}</h1>
                  <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #cbd5e1;">${options.greeting}</p>
                  <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">${options.description}</p>

                  <!-- OTP Code Box in Charcoal & Red -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121417; border: 1.5px solid #e53935; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 0 20px rgba(229, 57, 53, 0.12);">
                    <tr>
                      <td style="padding: 22px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 700; color: #ff5252; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 8px;">6-Digit Verification Code</div>
                        <div style="font-size: 36px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-weight: 900; letter-spacing: 8px; color: #ffffff;">${options.otp}</div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                    This code is valid for <strong>${options.validityMinutes} minutes</strong>. If you did not initiate this request, please disregard this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #14171b; border-top: 1px solid #262b32; padding: 18px 32px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #64748b;">
                    Sent at ${options.timestamp} • <span style="color: #94a3b8;">Kafei Intelligent Restaurant OS</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendRegistrationEmail(toEmail: string, otp: string, userName?: string, restaurantName?: string): Promise<boolean> {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = buildKafeiEmailHtml({
    title: 'Welcome to Kafei',
    greeting: `Hello ${userName || 'there'},`,
    description: `Please verify your email address to complete registration for <strong>${restaurantName || 'your restaurant'}</strong> and start your free trial.`,
    otp,
    validityMinutes: 10,
    timestamp,
  });

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || 'rikmukherjee21071999@gmail.com';
  const pass = process.env.SMTP_PASS || 'gfgf vktd icgs qfvm';
  const senderName = (process.env.SMTP_FROM_NAME || 'Kafei').replace(/["']/g, '').trim();
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
      subject: `Your Kafei verification code: ${otp}`,
      html,
      text: `Your Kafei registration verification code is ${otp}. It is valid for 10 minutes.`,
    });
    console.log(`[Registration Email] Delivered OTP to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`[Registration Email Error]: ${err?.message}`, err);
    return false;
  }
}

export async function provisionRegisteredAccount(challenge: RegistrationChallenge, userAgent?: string, ip?: string) {
  const pool = getRegPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if user already registered
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [challenge.email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email address has already been registered');
    }

    const baseSlug = slugify(challenge.restaurantName);
    let tenantSlug = baseSlug;

    // Check slug collision
    const slugCheck = await client.query('SELECT id FROM tenants WHERE slug = $1', [tenantSlug]);
    if (slugCheck.rows.length > 0) {
      tenantSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 2. Insert Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (id, name, slug, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'ACTIVE', NOW())
       RETURNING id, name, slug`,
      [challenge.restaurantName, tenantSlug],
    );
    const tenant = tenantRes.rows[0];

    // 3. Insert Restaurant
    const restRes = await client.query(
      `INSERT INTO restaurants (id, "tenantId", name, slug, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW())
       RETURNING id, name, slug`,
      [tenant.id, challenge.restaurantName, tenantSlug],
    );
    const restaurant = restRes.rows[0];

    // 4. Insert Main Branch
    const branchRes = await client.query(
      `INSERT INTO branches (id, "restaurantId", name, code, phone, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, 'Main Branch', 'MAIN', $2, 'ACTIVE', NOW())
       RETURNING id, name, code`,
      [restaurant.id, challenge.phone],
    );
    const branch = branchRes.rows[0];

    // 5. Insert Owner User
    const userRes = await client.query(
      `INSERT INTO users (id, name, email, phone, "passwordHash", role, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'OWNER', 'ACTIVE', NOW())
       RETURNING id, name, email, phone, role, status`,
      [challenge.ownerName, challenge.email, challenge.phone, challenge.passwordHash],
    );
    const user = userRes.rows[0];

    // 6. Insert Tenant Membership
    const memRes = await client.query(
      `INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'OWNER', NOW())
       RETURNING id, role`,
      [user.id, tenant.id],
    );
    const membership = memRes.rows[0];

    // 7. Insert Trial Subscription (Best effort)
    try {
      const planRes = await client.query(
        `SELECT id, "trialDays", "billingCycle" FROM plans
         WHERE status = 'ACTIVE'
         ORDER BY (name = 'Free') DESC, price ASC
         LIMIT 1`,
      );
      const plan = planRes.rows[0];
      if (plan) {
        const trialDays = Number(plan.trialDays) || 14;
        await client.query(
          `INSERT INTO subscriptions
             (id, "restaurantId", "planId", status, "billingCycle", "trialStart", "trialEnd",
              "currentPeriodStart", "currentPeriodEnd", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 'TRIALING', COALESCE($3::text, 'MONTHLY')::"BillingCycle", NOW(),
                   NOW() + ($4 || ' days')::interval, NOW(), NOW() + ($4 || ' days')::interval, NOW())`,
          [restaurant.id, plan.id, plan.billingCycle, String(trialDays)],
        );
      }
    } catch (subErr) {
      console.warn('[Registration] trial subscription skipped:', subErr);
    }

    // 8. Create Session
    const sessionRes = await client.query(
      `INSERT INTO sessions (id, "userId", "refreshTokenHash", "deviceName", "ipAddress", "userAgent", "expiresAt")
       VALUES (gen_random_uuid(), $1, '', $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING id`,
      [user.id, 'Web Registration', ip || null, userAgent || null],
    );
    const sessionId = sessionRes.rows[0].id;

    // 9. Sign JWT tokens
    const accessToken = jwt.sign(
      {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: 'OWNER',
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign({ sessionId }, JWT_SECRET, {
      expiresIn: '7d',
    });
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await client.query(
      'UPDATE sessions SET "refreshTokenHash" = $1 WHERE id = $2',
      [refreshTokenHash, sessionId],
    );

    await client.query('COMMIT');

    return {
      accessToken,
      refreshToken,
      user,
      tenant,
      restaurant,
      branch,
      membership,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
