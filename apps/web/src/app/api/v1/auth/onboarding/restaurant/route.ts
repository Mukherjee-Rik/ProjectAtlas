import { NextResponse } from 'next/server';
import { Pool, type PoolClient } from 'pg';
import * as jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Creates the first tenant + restaurant for a user who already exists.
 *
 * `POST /auth/signup` cannot do this: it refuses an email that is already
 * registered, and an OAuth sign-in registers the user before they have ever
 * named a restaurant. That left OAuth users with no route to a restaurant at
 * all — the signup form returned "Email address is already registered", nothing
 * was created, and the next sign-in asked for the same details again.
 *
 * The caller is identified from the access token, never from the body, so this
 * can only ever onboard the signed-in user.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.koytepvphexiwrjjelai:Atla6Dev%401999@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744';

let onboardingPool: Pool | null = null;

function getPool(): Pool {
  if (!onboardingPool) {
    onboardingPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    onboardingPool.on('error', (err) =>
      console.warn('[Onboarding Pool] Warning:', err.message),
    );
  }
  return onboardingPool;
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

function randomSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface MembershipRow {
  id: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
}

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface BranchRow {
  id: string;
  name: string;
  code: string;
}

interface TokenPayload {
  userId?: string;
  sub?: string;
  sessionId?: string;
}

function readBearer(req: Request): TokenPayload | null {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/** Shapes memberships the way the login and OAuth responses already do. */
async function loadMemberships(client: PoolClient, userId: string) {
  const memRes = await client.query<MembershipRow>(
    `SELECT tm.id, tm.role,
            t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status
       FROM tenant_memberships tm
       JOIN tenants t ON t.id = tm."tenantId"
      WHERE tm."userId" = $1 AND t.status = 'ACTIVE'`,
    [userId],
  );

  return Promise.all(
    memRes.rows.map(async (m) => {
      const restRes = await client.query<RestaurantRow>(
        `SELECT r.id, r.name, r.slug, r.status
           FROM restaurants r
          WHERE r."tenantId" = $1 AND r.status = 'ACTIVE'`,
        [m.tenant_id],
      );
      const restaurants = await Promise.all(
        restRes.rows.map(async (r) => {
          const branchRes = await client.query<BranchRow>(
            `SELECT b.id, b.name, b.code FROM branches b
              WHERE b."restaurantId" = $1 AND b.status = 'ACTIVE'`,
            [r.id],
          );
          return { id: r.id, name: r.name, slug: r.slug, status: r.status, branches: branchRes.rows };
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
}

export async function POST(req: Request) {
  const payload = readBearer(req);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Sign in again to finish setting up your restaurant.' },
      { status: 401 },
    );
  }

  const userId = payload.userId || payload.sub;
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Invalid session token' }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const restaurantName = String(body.restaurantName ?? '').trim();
  // Only these two have columns to live in — on branches, not restaurants.
  const phone = String(body.phone ?? '').trim() || null;
  const address = String(body.address ?? '').trim() || null;

  if (restaurantName.length < 2) {
    return NextResponse.json(
      { success: false, message: 'Restaurant name must be at least 2 characters' },
      { status: 400 },
    );
  }

  const client = await getPool().connect();

  try {
    const userRes = await client.query(
      'SELECT id, name, email, phone, role, status FROM users WHERE id = $1',
      [userId],
    );
    const user = userRes.rows[0];

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: 'User account is not active' }, { status: 403 });
    }

    // Already onboarded: hand back what exists rather than creating a second
    // tenant. A retry after a half-finished attempt should settle, not duplicate.
    const existing = await loadMemberships(client, userId);
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyOnboarded: true,
        data: { user, memberships: existing },
      });
    }

    let tenantId = '';
    let restaurantId = '';
    let branchId = '';
    let tenantSlug = '';

    // One attempt per slug; a collision on the globally unique tenant slug is
    // retried once with a suffix rather than surfaced to the operator.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      tenantSlug = attempt === 0 ? slugify(restaurantName) : `${slugify(restaurantName)}-${randomSuffix()}`;
      try {
        await client.query('BEGIN');

        const tenantRes = await client.query(
          `INSERT INTO tenants (id, name, slug, status, "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 'ACTIVE', NOW())
           RETURNING id, name, slug`,
          [restaurantName, tenantSlug],
        );
        tenantId = tenantRes.rows[0].id;

        const restRes = await client.query(
          `INSERT INTO restaurants (id, "tenantId", name, slug, status, "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW())
           RETURNING id, name, slug`,
          [tenantId, restaurantName, tenantSlug],
        );
        restaurantId = restRes.rows[0].id;

        const branchRes = await client.query(
          `INSERT INTO branches (id, "restaurantId", name, code, phone, address, status, "updatedAt")
           VALUES (gen_random_uuid(), $1, 'Main Branch', 'MAIN', $2, $3, 'ACTIVE', NOW())
           RETURNING id, name, code`,
          [restaurantId, phone, address],
        );
        branchId = branchRes.rows[0].id;

        await client.query(
          `INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 'OWNER', NOW())`,
          [userId, tenantId],
        );

        // Promote the placeholder role OAuth hands out. An ADMIN or
        // PLATFORM_ADMIN keeps the role they already have.
        await client.query(
          `UPDATE users SET role = 'OWNER', "updatedAt" = NOW() WHERE id = $1 AND role = 'USER'`,
          [userId],
        );

        await client.query('COMMIT');
        break;
      } catch (err: unknown) {
        await client.query('ROLLBACK').catch(() => {});
        const isSlugCollision = (err as { code?: string } | undefined)?.code === '23505';
        if (!isSlugCollision || attempt === 1) throw err;
      }
    }

    // Best effort, and deliberately outside the transaction: a missing plan
    // table or seed should not cost the operator their restaurant.
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
          [restaurantId, plan.id, plan.billingCycle, String(trialDays)],
        );
      }
    } catch (subErr: unknown) {
      console.warn(
        '[Onboarding] trial subscription skipped:',
        subErr instanceof Error ? subErr.message : subErr,
      );
    }

    const memberships = await loadMemberships(client, userId);
    const role = user.role === 'USER' ? 'OWNER' : user.role;

    // Re-issue the access token so it carries the promoted role.
    const accessToken = jwt.sign(
      {
        sub: userId,
        userId,
        email: user.email,
        role,
        sessionId: payload.sessionId,
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: { ...user, role },
        tenant: { id: tenantId, name: restaurantName, slug: tenantSlug },
        restaurant: { id: restaurantId, name: restaurantName, slug: tenantSlug },
        branch: { id: branchId, name: 'Main Branch', code: 'MAIN' },
        memberships,
      },
    });
  } catch (err: unknown) {
    console.error('[Onboarding] create restaurant failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Could not create the restaurant',
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
