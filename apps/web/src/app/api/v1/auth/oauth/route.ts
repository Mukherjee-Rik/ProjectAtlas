import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.koytepvphexiwrjjelai:Atla6Dev%401999@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744';

let directPool: Pool | null = null;

function getDirectPool(): Pool {
  if (!directPool) {
    directPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    directPool.on('error', (err) =>
      console.warn('[Direct OAuth Pool] Warning:', err.message),
    );
  }
  return directPool;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider = 'google', email, name } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pool = getDirectPool();

    // 1. Find or create user
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [
      normalizedEmail,
    ]);
    let user = userRes.rows[0];

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const displayName = name?.trim() || normalizedEmail.split('@')[0];
      const insertRes = await pool.query(
        `INSERT INTO users (id, name, email, "passwordHash", role, status, "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'USER', 'ACTIVE', NOW())
         RETURNING *`,
        [displayName, normalizedEmail, randomPassword],
      );
      user = insertRes.rows[0];
    } else if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'User account is not active' },
        { status: 403 },
      );
    }

    // 2. Fetch memberships
    const memRes = await pool.query(
      `SELECT tm.id, tm.role, tm.status,
              t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status
       FROM tenant_memberships tm
       JOIN tenants t ON t.id = tm."tenantId"
       WHERE tm."userId" = $1 AND tm.status = 'ACTIVE' AND t.status = 'ACTIVE'`,
      [user.id],
    );

    const memberships = await Promise.all(
      memRes.rows.map(async (m: any) => {
        const restRes = await pool.query(
          `SELECT r.id, r.name, r.slug, r.status
           FROM restaurants r
           WHERE r."tenantId" = $1 AND r.status = 'ACTIVE'`,
          [m.tenant_id],
        );
        const restaurants = await Promise.all(
          restRes.rows.map(async (r: any) => {
            const branchRes = await pool.query(
              `SELECT b.id, b.name, b.code FROM branches b WHERE b."restaurantId" = $1 AND b.status = 'ACTIVE'`,
              [r.id],
            );
            return {
              id: r.id,
              name: r.name,
              slug: r.slug,
              status: r.status,
              branches: branchRes.rows,
            };
          }),
        );
        return {
          id: m.id,
          role: m.role,
          status: m.status,
          tenant: {
            id: m.tenant_id,
            name: m.tenant_name,
            slug: m.tenant_slug,
            status: m.tenant_status,
            restaurants,
          },
        };
      }),
    );

    // 3. Create Session
    const userAgent = req.headers.get('user-agent') || '';
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      '';

    const sessionRes = await pool.query(
      `INSERT INTO sessions (id, "userId", "refreshTokenHash", "deviceName", "ipAddress", "userAgent", "expiresAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, '', $2, $3, $4, NOW() + INTERVAL '7 days', NOW())
       RETURNING id`,
      [
        user.id,
        `${provider.toUpperCase()} Login`,
        ip || null,
        userAgent || null,
      ],
    );
    const sessionId = sessionRes.rows[0].id;

    // 4. Sign JWT
    const accessToken = jwt.sign(
      {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
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

    await pool.query(
      'UPDATE sessions SET "refreshTokenHash" = $1 WHERE id = $2',
      [refreshTokenHash, sessionId],
    );

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          role: user.role,
          status: user.status,
        },
        memberships,
      },
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Direct /api/v1/auth/oauth error:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'OAuth authentication failed',
      },
      { status: 500 },
    );
  }
}
