import { type NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

// This route is a pass-through to the Atlas API; nothing about it is static.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXPLICIT_BACKEND_URL = process.env.BACKEND_URL || process.env.API_INTERNAL_URL;

const PRIMARY_BACKEND_URL = EXPLICIT_BACKEND_URL || 'http://127.0.0.1:4002/api/v1';

/**
 * Last-resort target, used only when the primary is unreachable at the socket
 * level. The hardcoded default is retained because existing deployments may
 * still depend on it, but relying on it means production traffic silently
 * crosses into another environment's API — set BACKEND_URL explicitly and
 * then drop this default.
 */
const FALLBACK_BACKEND_URL =
  process.env.BACKEND_FALLBACK_URL ||
  'https://projectatlas-production-0c80.up.railway.app/api/v1';

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

async function handleDirectOAuthFallback(
  bodyData: any,
  userAgent: string,
  ip: string,
) {
  const { provider = 'google', email, name } = bodyData || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json(
      { success: false, message: 'Invalid email address' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = getDirectPool();

  try {
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
      `SELECT tm.id, tm.role,
              t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status
       FROM tenant_memberships tm
       JOIN tenants t ON t.id = tm."tenantId"
       WHERE tm."userId" = $1 AND t.status = 'ACTIVE'`,
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
    const sessionRes = await pool.query(
      `INSERT INTO sessions (id, "userId", "refreshTokenHash", "deviceName", "ipAddress", "userAgent", "expiresAt")
       VALUES (gen_random_uuid(), $1, '', $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING id`,
      [
        user.id,
        `${provider.toUpperCase()} Login`,
        ip || null,
        userAgent || null,
      ],
    );
    const sessionId = sessionRes.rows[0].id;

    // 4. Sign JWT access and refresh tokens
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
    console.error('[Direct OAuth Fallback Error]:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Direct OAuth authentication error',
      },
      { status: 500 },
    );
  }
}

if (!EXPLICIT_BACKEND_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    '[proxy] BACKEND_URL is not set in a production build. Requests will attempt localhost first and then fall back to the hardcoded Railway API. Set BACKEND_URL to remove this ambiguity.',
  );
}

/** Stops a stalled upstream from pinning a Next.js server thread indefinitely. */
const UPSTREAM_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 30_000);

/**
 * Hop-by-hop headers are connection-scoped and must not be forwarded.
 * Content-encoding/length are dropped separately because we hand the body
 * through as a stream and let the runtime frame it.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'expect',
]);

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'content-length' || HOP_BY_HOP.has(lower)) {
      return;
    }
    headers.set(key, value);
  });

  return headers;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // The body is re-framed by this runtime, so the upstream's encoding and
    // chunking headers no longer describe what we are sending.
    if (lower === 'content-encoding' || lower === 'content-length' || HOP_BY_HOP.has(lower)) {
      return;
    }
    if (lower === 'set-cookie') {
      headers.append(key, value);
    } else {
      headers.set(key, value);
    }
  });

  return headers;
}

async function forward(
  targetUrl: string,
  request: NextRequest,
  headers: Headers,
  body: ArrayBuffer | undefined,
): Promise<Response> {
  const init: RequestInit = {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  return fetch(targetUrl, init);
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = path.join('/');
  const search = request.nextUrl.search;

  const forwardHeaders = buildForwardHeaders(request);

  let rawBody: string | undefined;
  let bodyBuffer: ArrayBuffer | undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    rawBody = await request.text();
    if (rawBody) {
      bodyBuffer = new TextEncoder().encode(rawBody).buffer as ArrayBuffer;
    }
  }

  const primaryUrl = `${PRIMARY_BACKEND_URL.replace(/\/+$/, '')}/${targetPath}${search}`;

  let upstream: Response | null = null;
  let lastError: unknown = null;

  try {
    upstream = await forward(primaryUrl, request, forwardHeaders, bodyBuffer);
  } catch (err: any) {
    lastError = err;
    const causeMsg = err?.cause ? ` (cause: ${err.cause.message || err.cause})` : '';
    const message = (err instanceof Error ? err.message : String(err)) + causeMsg;
    console.warn(`[proxy] primary backend unreachable (${primaryUrl}): ${message}`);

    if (FALLBACK_BACKEND_URL && FALLBACK_BACKEND_URL !== PRIMARY_BACKEND_URL) {
      const fallbackUrl = `${FALLBACK_BACKEND_URL.replace(/\/+$/, '')}/${targetPath}${search}`;
      try {
        upstream = await forward(fallbackUrl, request, forwardHeaders, bodyBuffer);
        console.warn(`[proxy] served from fallback backend: ${fallbackUrl}`);
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        const fallbackCauseMsg = fallbackErr?.cause
          ? ` (cause: ${fallbackErr.cause.message || fallbackErr.cause})`
          : '';
        const fallbackMessage =
          (fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)) + fallbackCauseMsg;
        console.error(`[proxy] fallback backend unreachable (${fallbackUrl}): ${fallbackMessage}`);
      }
    }
  }

  // If upstream returned 404 on auth/oauth (e.g. backend missing OAuth endpoint), execute direct OAuth
  if (
    targetPath === 'auth/oauth' &&
    (!upstream || upstream.status === 404 || upstream.status === 503 || upstream.status === 502)
  ) {
    try {
      const parsedBody = rawBody ? JSON.parse(rawBody) : {};
      const userAgent = request.headers.get('user-agent') || '';
      const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '';
      return await handleDirectOAuthFallback(parsedBody, userAgent, ip);
    } catch (parseErr) {
      console.error('[OAuth Fallback parse error]:', parseErr);
    }
  }

  if (!upstream) {
    const timedOut = lastError instanceof Error && lastError.name === 'TimeoutError';

    return NextResponse.json(
      {
        success: false,
        statusCode: timedOut ? 504 : 503,
        error: timedOut
          ? 'The Atlas API did not respond in time. Please try again.'
          : 'Unable to reach the Atlas API. Please try again shortly.',
      },
      { status: timedOut ? 504 : 503 },
    );
  }

  // Stream the body straight through rather than buffering the whole payload
  // in memory first — this cuts time-to-first-byte on large list responses.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
