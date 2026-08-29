import { NextResponse } from 'next/server';
import { Pool, type PoolClient } from 'pg';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Persists the onboarding wizard's sections for the signed-in owner.
 *
 * One endpoint rather than one per step: each section is independent and
 * idempotent, so the wizard can call this as each step is completed and a
 * revisit cannot duplicate anything.
 *
 * The tenant, restaurant and branch are resolved from the caller's membership —
 * never from the request — so an operator can only ever fill in their own
 * restaurant.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.koytepvphexiwrjjelai:Atla6Dev%401999@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744';

/** Roles an owner may hand out during setup. Deliberately excludes OWNER/ADMIN. */
const ASSIGNABLE_ROLES = new Set(['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN', 'STAFF']);

const DIETARY_TYPES = new Set(['VEG', 'NON_VEG', 'EGG', 'VEGAN']);

/** Guards against a typo in the seating mix provisioning thousands of tables. */
const MAX_TABLES = 200;

let setupPool: Pool | null = null;

function getPool(): Pool {
  if (!setupPool) {
    setupPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    setupPool.on('error', (err) => console.warn('[Setup Pool] Warning:', err.message));
  }
  return setupPool;
}

function readBearer(req: Request): { userId?: string } | null {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string; sub?: string };
    return { userId: payload.userId || payload.sub };
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Raised when a section would take the restaurant past its plan. */
class QuotaExceeded extends Error {}

interface Entitlement {
  planName: string;
  limits: Record<string, number>;
}

/**
 * The plan currently entitling this restaurant, or null if there isn't one.
 *
 * Mirrors SubscriptionUsageService.getActiveSubscription: a trial counts only
 * while it is still running. This route writes to the database directly, so it
 * has to apply the same rule the API applies — otherwise onboarding would be a
 * way around the very quotas the rest of the app enforces.
 */
async function loadEntitlement(
  client: PoolClient,
  restaurantId: string,
): Promise<Entitlement | null> {
  const res = await client.query<{ name: string; limits: Record<string, number> | null }>(
    `SELECT p.name, p.limits
       FROM subscriptions s
       JOIN plans p ON p.id = s."planId"
      WHERE s."restaurantId" = $1
        AND (s.status = 'ACTIVE'
             OR (s.status = 'TRIALING'
                 AND (s."trialEnd" IS NULL OR s."trialEnd" > NOW())))
      ORDER BY s."createdAt" DESC
      LIMIT 1`,
    [restaurantId],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { planName: row.name, limits: row.limits ?? {} };
}

/** -1 (or an absent key) means unlimited, matching the API. */
function limitOf(entitlement: Entitlement, key: string): number {
  const value = entitlement.limits[key];
  return value === undefined ? -1 : value;
}

function plural(n: number, word: string): string {
  return n === 1 ? '1 ' + word : n + ' ' + word + 's';
}

interface Context {
  tenantId: string;
  restaurantId: string;
  branchId: string | null;
}

async function resolveContext(client: PoolClient, userId: string): Promise<Context | null> {
  const res = await client.query<{ tenant_id: string; restaurant_id: string; branch_id: string | null }>(
    `SELECT t.id AS tenant_id, r.id AS restaurant_id, b.id AS branch_id
       FROM tenant_memberships tm
       JOIN tenants t ON t.id = tm."tenantId"
       JOIN restaurants r ON r."tenantId" = t.id
       LEFT JOIN branches b ON b."restaurantId" = r.id AND b.status = 'ACTIVE'
      WHERE tm."userId" = $1 AND t.status = 'ACTIVE' AND r.status = 'ACTIVE'
      ORDER BY r."createdAt" ASC, b."createdAt" ASC
      LIMIT 1`,
    [userId],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { tenantId: row.tenant_id, restaurantId: row.restaurant_id, branchId: row.branch_id };
}

/**
 * Turns a seating mix — "two 2-seaters, three 4-seaters" — into concrete tables.
 * Ordered by capacity so the generated numbering reads sensibly on the floor.
 */
function planTables(seating: unknown): { seats: number }[] {
  if (!Array.isArray(seating)) return [];
  const rows = seating
    .map((entry) => {
      const e = entry as Record<string, unknown>;
      return { seats: asInt(e?.seats), count: asInt(e?.count) };
    })
    .filter((r) => r.seats > 0 && r.seats <= 40 && r.count > 0)
    .sort((a, b) => a.seats - b.seats);

  const plan: { seats: number }[] = [];
  for (const row of rows) {
    for (let i = 0; i < row.count && plan.length < MAX_TABLES; i += 1) {
      plan.push({ seats: row.seats });
    }
  }
  return plan;
}

async function applyFloor(
  client: PoolClient,
  ctx: Context,
  entitlement: Entitlement,
  section: Record<string, unknown>,
) {
  if (!ctx.branchId) {
    return { skipped: 'no active branch on this restaurant' };
  }

  const areaName = asString(section.diningAreaName) || 'Main Dining Area';
  const plan = planTables(section.seating);

  const maxTables = limitOf(entitlement, 'maxTables');
  if (maxTables !== -1 && plan.length > maxTables) {
    throw new QuotaExceeded(
      `Your ${entitlement.planName} plan covers ${plural(maxTables, 'table')}. ` +
        'Reduce the seating plan or upgrade to add more.',
    );
  }

  // One dining area per onboarding, keyed by a fixed code so a revisit updates
  // rather than piles up a second area.
  await client.query(
    `INSERT INTO dining_areas (id, "branchId", name, code, status, "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 'MAIN-AREA', 'ACTIVE', NOW())
     ON CONFLICT ("branchId", code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
    [ctx.branchId, areaName],
  );

  const areaRes = await client.query<{ id: string }>(
    `SELECT id FROM dining_areas WHERE "branchId" = $1 AND code = 'MAIN-AREA'`,
    [ctx.branchId],
  );
  const diningAreaId = areaRes.rows[0].id;

  let created = 0;
  let updated = 0;
  for (let i = 0; i < plan.length; i += 1) {
    const code = `T-${pad(i + 1)}`;
    // publicToken defaults to gen_random_uuid(), so every table gets its QR
    // identity without anyone typing anything.
    //
    // Upserting the capacity means an operator who comes back and changes the
    // mix actually sees it applied. `xmax = 0` separates a fresh insert from an
    // update, which rowCount alone cannot.
    const ins = await client.query<{ inserted: boolean }>(
      `INSERT INTO tables (id, "diningAreaId", name, code, capacity, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', NOW())
       ON CONFLICT ("diningAreaId", code)
       DO UPDATE SET capacity = EXCLUDED.capacity, name = EXCLUDED.name,
                     status = 'ACTIVE', "updatedAt" = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [diningAreaId, `Table ${pad(i + 1)}`, code, plan[i].seats],
    );
    if (ins.rows[0]?.inserted) created += 1;
    else updated += 1;
  }

  // A smaller plan retires the surplus instead of deleting it: orders and
  // customer sessions reference tables, so they come off the floor, not out
  // of the database.
  const retired = await client.query(
    `UPDATE tables SET status = 'INACTIVE', "updatedAt" = NOW()
      WHERE "diningAreaId" = $1
        AND status = 'ACTIVE'
        AND code ~ '^T-[0-9]+$'
        AND (substring(code from 3))::int > $2`,
    [diningAreaId, plan.length],
  );

  const totals = await client.query<{ tables: string; covers: string }>(
    `SELECT COUNT(*)::text AS tables, COALESCE(SUM(capacity), 0)::text AS covers
       FROM tables WHERE "diningAreaId" = $1 AND status = 'ACTIVE'`,
    [diningAreaId],
  );

  return {
    diningAreaId,
    diningAreaName: areaName,
    tablesRequested: plan.length,
    tablesCreated: created,
    tablesUpdated: updated,
    tablesRetired: retired.rowCount ?? 0,
    tablesTotal: Number(totals.rows[0].tables),
    coversTotal: Number(totals.rows[0].covers),
  };
}

async function applyMenu(
  client: PoolClient,
  ctx: Context,
  entitlement: Entitlement,
  section: Record<string, unknown>,
) {
  const maxMenus = limitOf(entitlement, 'maxMenus');
  if (maxMenus !== -1) {
    // Only a menu that does not exist yet consumes quota; this route upserts a
    // single fixed code, so re-running never costs another slot.
    const existing = await client.query<{ count: string; has_ours: boolean }>(
      `SELECT COUNT(*)::text AS count,
              BOOL_OR(code = 'MAIN-MENU') AS has_ours
         FROM menus WHERE "restaurantId" = $1`,
      [ctx.restaurantId],
    );
    const current = Number(existing.rows[0].count);
    const alreadyOurs = existing.rows[0].has_ours === true;
    if (!alreadyOurs && current >= maxMenus) {
      throw new QuotaExceeded(
        `Your ${entitlement.planName} plan covers ${plural(maxMenus, 'menu')}. ` +
          'Upgrade to add another.',
      );
    }
  }

  const menuName = asString(section.menuName) || 'All-Day Dining';
  const categoryName = asString(section.categoryName) || 'Chef Specials';
  const dishName = asString(section.dishName);
  const priceRaw = Number(section.dishPrice);
  const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0;
  const dietaryRaw = asString(section.dietaryType).toUpperCase();
  const dietaryType = DIETARY_TYPES.has(dietaryRaw) ? dietaryRaw : 'VEG';

  await client.query(
    `INSERT INTO menus (id, "restaurantId", name, code, status, "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 'MAIN-MENU', 'ACTIVE', NOW())
     ON CONFLICT ("restaurantId", code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
    [ctx.restaurantId, menuName],
  );
  const menuRes = await client.query<{ id: string }>(
    `SELECT id FROM menus WHERE "restaurantId" = $1 AND code = 'MAIN-MENU'`,
    [ctx.restaurantId],
  );
  const menuId = menuRes.rows[0].id;

  await client.query(
    `INSERT INTO menu_categories (id, "menuId", name, code, position, status, "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 'CAT-01', 0, 'ACTIVE', NOW())
     ON CONFLICT ("menuId", code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
    [menuId, categoryName],
  );
  const catRes = await client.query<{ id: string }>(
    `SELECT id FROM menu_categories WHERE "menuId" = $1 AND code = 'CAT-01'`,
    [menuId],
  );
  const categoryId = catRes.rows[0].id;

  let itemId: string | null = null;
  if (dishName.length > 0) {
    await client.query(
      `INSERT INTO menu_items (id, "categoryId", name, code, price, "dietaryType", "foodType", position, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'ITEM-01', $3, $4::"DietaryType", 'FOOD', 0, 'ACTIVE', NOW())
       ON CONFLICT ("categoryId", code)
       DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price,
                     "dietaryType" = EXCLUDED."dietaryType", "updatedAt" = NOW()`,
      [categoryId, dishName, price, dietaryType],
    );
    const itemRes = await client.query<{ id: string }>(
      `SELECT id FROM menu_items WHERE "categoryId" = $1 AND code = 'ITEM-01'`,
      [categoryId],
    );
    itemId = itemRes.rows[0]?.id ?? null;
  }

  return { menuId, menuName, categoryId, categoryName, itemId, dishName: dishName || null, price };
}

async function applyStaff(
  client: PoolClient,
  ctx: Context,
  entitlement: Entitlement,
  section: Record<string, unknown>,
) {
  const email = asString(section.email).toLowerCase();
  const roleRaw = asString(section.role).toUpperCase();

  if (!email.includes('@')) return { skipped: 'no staff email provided' };
  if (!ASSIGNABLE_ROLES.has(roleRaw)) {
    return { skipped: `role ${roleRaw || '(none)'} cannot be assigned during setup` };
  }

  const found = await client.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  let staffUserId = found.rows[0]?.id ?? null;
  let userCreated = false;

  // Staff is counted as memberships on the tenant, which includes the owner —
  // so a one-seat plan means the owner alone, exactly as the API counts it.
  const maxStaff = limitOf(entitlement, 'maxStaff');
  if (maxStaff !== -1) {
    const counted = await client.query<{ count: string; already: boolean }>(
      `SELECT COUNT(*)::text AS count,
              BOOL_OR("userId" = $2) AS already
         FROM tenant_memberships WHERE "tenantId" = $1`,
      [ctx.tenantId, staffUserId],
    );
    const current = Number(counted.rows[0].count);
    const alreadyMember = counted.rows[0].already === true;
    if (!alreadyMember && current >= maxStaff) {
      throw new QuotaExceeded(
        `Your ${entitlement.planName} plan covers ${plural(maxStaff, 'team member')}, ` +
          'including you. Upgrade to invite more.',
      );
    }
  }

  if (!staffUserId) {
    // A placeholder secret: the invitee signs in through OAuth or a password
    // reset, so no usable password is ever set here.
    const placeholder = crypto.randomBytes(32).toString('hex');
    const ins = await client.query<{ id: string }>(
      `INSERT INTO users (id, name, email, "passwordHash", role, status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::"UserRole", 'ACTIVE', NOW())
       RETURNING id`,
      [email.split('@')[0], email, placeholder, roleRaw],
    );
    staffUserId = ins.rows[0].id;
    userCreated = true;
  }

  const mem = await client.query(
    `INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3::"UserRole", NOW())
     ON CONFLICT ("userId", "tenantId") DO UPDATE SET role = EXCLUDED.role, "updatedAt" = NOW()`,
    [staffUserId, ctx.tenantId, roleRaw],
  );

  return { staffUserId, email, role: roleRaw, userCreated, membershipWritten: (mem.rowCount ?? 0) > 0 };
}

export async function POST(req: Request) {
  const auth = readBearer(req);
  if (!auth?.userId) {
    return NextResponse.json(
      { success: false, message: 'Sign in again to continue setting up.' },
      { status: 401 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  const client = await getPool().connect();

  try {
    const ctx = await resolveContext(client, auth.userId);
    if (!ctx) {
      return NextResponse.json(
        { success: false, message: 'Create your restaurant first.' },
        { status: 409 },
      );
    }

    const entitlement = await loadEntitlement(client, ctx.restaurantId);
    if (!entitlement) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your free trial has ended. Choose a plan to continue setting up.',
        },
        { status: 402 },
      );
    }

    const result: Record<string, unknown> = {};

    await client.query('BEGIN');
    try {
      if (body.floor && typeof body.floor === 'object') {
        result.floor = await applyFloor(client, ctx, entitlement, body.floor as Record<string, unknown>);
      }
      if (body.menu && typeof body.menu === 'object') {
        result.menu = await applyMenu(client, ctx, entitlement, body.menu as Record<string, unknown>);
      }
      if (body.staff && typeof body.staff === 'object') {
        result.staff = await applyStaff(client, ctx, entitlement, body.staff as Record<string, unknown>);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      if (err instanceof QuotaExceeded) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
      }
      throw err;
    }

    // Payment channels have no column anywhere in the schema, so the step 6
    // toggles are reported back as unsaved rather than silently dropped.
    if (body.payments && typeof body.payments === 'object') {
      result.payments = { saved: false, reason: 'no payment-method storage in the schema yet' };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    console.error('[Onboarding setup] failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Could not save your setup details',
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
