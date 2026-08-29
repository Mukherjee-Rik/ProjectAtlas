/**
 * Sets the quotas each subscription plan enforces.
 *
 * `plans.limits` is the single source of truth: SubscriptionUsageService reads it
 * on every create of a table, staff member, branch or menu, and the landing page
 * quotes the same numbers. Change them here rather than by hand in the database,
 * so the values stay reproducible across environments.
 *
 * A limit of -1 means unlimited.
 *
 * Usage:  node scripts/set-trial-plan-limits.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const { Pool } = require(join(here, '..', 'apps', 'web', 'node_modules', 'pg'));

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(join(here, '..', 'apps', 'api', '.env'), 'utf8');
  const raw = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1];
  if (!raw) throw new Error('DATABASE_URL not set and not found in apps/api/.env');
  return raw.trim().replace(/^["']/, '').replace(/["']$/, '');
}

/** The trial is deliberately one of each, so the shape of the app is visible without giving the room away. */
const PLAN_LIMITS = {
  Free: { maxTables: 1, maxStaff: 1, maxBranches: 1, maxMenus: 1 },
  Starter: { maxTables: 20, maxStaff: 5, maxBranches: 1, maxMenus: 5 },
  Growth: { maxTables: 100, maxStaff: 50, maxBranches: 5, maxMenus: 20 },
  Enterprise: { maxTables: -1, maxStaff: -1, maxBranches: -1, maxMenus: -1 },
};

const pool = new Pool({ connectionString: databaseUrl(), max: 1, connectionTimeoutMillis: 20000 });

try {
  for (const [name, limits] of Object.entries(PLAN_LIMITS)) {
    const res = await pool.query(
      'UPDATE plans SET limits = $1::jsonb, "updatedAt" = NOW() WHERE name = $2 RETURNING name, limits',
      [JSON.stringify(limits), name],
    );
    if (res.rowCount === 0) {
      console.warn(`skipped ${name}: no such plan`);
    } else {
      console.log(`${name}: ${JSON.stringify(res.rows[0].limits)}`);
    }
  }
} finally {
  await pool.end();
}
