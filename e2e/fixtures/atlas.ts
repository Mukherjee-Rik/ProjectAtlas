import { test as base, expect, type Page } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';

export interface SeededRestaurant {
  email: string;
  password: string;
  ownerName: string;
  restaurantName: string;
  accessToken: string;
  tenantId: string;
  restaurantId: string;
  branchId: string;
}

export interface SeededMenu {
  menuId: string;
  categoryId: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
}

export interface SeededTable {
  tableId: string;
  tableName: string;
  /** QR token that identifies the table on the customer-facing routes. */
  token: string;
}

/** Unique per run so parallel workers never collide on unique columns. */
function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

class AtlasApi {
  constructor(private readonly token?: string, private readonly context?: Record<string, string>) {}

  withAuth(token: string, context?: Record<string, string>): AtlasApi {
    return new AtlasApi(token, context);
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    Object.assign(headers, this.context ?? {});

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: any;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      throw new Error(
        `${method} ${path} failed with ${res.status}: ${JSON.stringify(parsed)?.slice(0, 400)}`,
      );
    }

    return parsed;
  }

  get = <T = any>(path: string) => this.request<T>('GET', path);
  post = <T = any>(path: string, body?: unknown) => this.request<T>('POST', path, body);
  patch = <T = any>(path: string, body?: unknown) => this.request<T>('PATCH', path, body);
}

/**
 * Creates a brand-new tenant + restaurant + branch + trial subscription via
 * the real signup endpoint, so each spec starts from a known-empty workspace
 * and never depends on pre-existing seed data.
 */
export async function seedRestaurant(): Promise<SeededRestaurant> {
  const api = new AtlasApi();
  const slug = unique('qa');
  const email = `${slug}@atlas-e2e.test`;
  const password = 'AtlasE2E!2026';
  const restaurantName = `QA ${slug}`;

  const signup = await api.post('/auth/signup', {
    restaurantName,
    ownerName: 'QA Owner',
    email,
    password,
  });

  const accessToken: string = signup.data.accessToken;

  // Take the ids straight from the signup response. Reading them back from
  // list endpoints and taking [0] is not safe: parallel workers each create a
  // tenant, so "most recently created" is a race, not this worker's workspace.
  const tenantId: string | undefined =
    signup.data.tenant?.id ?? signup.data.tenantId;
  const restaurantId: string | undefined =
    signup.data.restaurant?.id ?? signup.data.restaurantId;
  const branchId: string | undefined =
    signup.data.branch?.id ?? signup.data.branchId;

  if (!tenantId || !restaurantId || !branchId) {
    throw new Error(
      `Signup did not return the full workspace context. Got: ${JSON.stringify(
        { tenantId, restaurantId, branchId },
      )}. Response keys: ${Object.keys(signup.data ?? {}).join(', ')}`,
    );
  }

  return {
    email,
    password,
    ownerName: 'QA Owner',
    restaurantName,
    accessToken,
    tenantId,
    restaurantId,
    branchId,
  };
}

export function scopedApi(restaurant: SeededRestaurant): AtlasApi {
  return new AtlasApi(restaurant.accessToken, {
    'x-tenant-id': restaurant.tenantId,
    'x-restaurant-id': restaurant.restaurantId,
    'x-branch-id': restaurant.branchId,
  });
}

/** Menu → category → item, the minimum needed for a customer to order. */
export async function seedMenu(restaurant: SeededRestaurant): Promise<SeededMenu> {
  const api = scopedApi(restaurant);

  const menu = await api.post('/menus', {
    name: 'QA Main Menu',
    code: unique('MENU').toUpperCase().slice(0, 20),
    status: 'ACTIVE',
  });
  const menuId: string = menu.data?.id ?? menu.id;

  const category = await api.post('/menu-categories', {
    menuId,
    name: 'QA Mains',
    code: unique('CAT').toUpperCase().slice(0, 20),
    position: 1,
    status: 'ACTIVE',
  });
  const categoryId: string = category.data?.id ?? category.id;

  const menuItemName = 'QA Paneer Butter Masala';
  const menuItemPrice = 250;

  const item = await api.post('/menu-items', {
    categoryId,
    name: menuItemName,
    code: unique('ITEM').toUpperCase().slice(0, 20),
    description: 'Seeded by the end-to-end suite',
    price: menuItemPrice,
    status: 'ACTIVE',
  });

  return {
    menuId,
    categoryId,
    menuItemId: item.data?.id ?? item.id,
    menuItemName,
    menuItemPrice,
  };
}

/** Dining area → table, and resolves the table's public QR token. */
export async function seedTable(restaurant: SeededRestaurant): Promise<SeededTable> {
  const api = scopedApi(restaurant);

  const area = await api.post('/dining-areas', {
    name: 'QA Ground Floor',
    code: unique('AREA').toUpperCase().slice(0, 20),
    status: 'ACTIVE',
  });
  const diningAreaId: string = area.data?.id ?? area.id;

  const tableName = 'QA-T1';
  const table = await api.post('/tables', {
    diningAreaId,
    name: tableName,
    code: unique('T').toUpperCase().slice(0, 20),
    capacity: 4,
    status: 'ACTIVE',
  });

  const created = table.data ?? table;
  const tableId: string = created.id;

  // `publicToken` is what the customer-facing /t/[token] routes key on.
  let token: string | undefined = created.publicToken;
  if (!token) {
    const detail = await api.get(`/tables/${tableId}`);
    const record = detail.data ?? detail;
    token = record.publicToken;
  }

  if (!token) {
    throw new Error(`Could not resolve a public token for seeded table ${tableId}`);
  }

  return { tableId, tableName, token };
}

/** Drives the public/customer endpoints to place a real order on a table. */
export async function placeCustomerOrder(
  table: SeededTable,
  menu: SeededMenu,
  quantity = 2,
): Promise<{ orderId: string; orderNumber: string }> {
  const api = new AtlasApi();

  await api.post(`/public/tables/${table.token}/session`, {});
  await api.post(`/public/tables/${table.token}/cart/items`, {
    menuItemId: menu.menuItemId,
    quantity,
  });

  const order = await api.post(`/public/tables/${table.token}/orders`, {});
  const created = order.data ?? order;

  return { orderId: created.id, orderNumber: created.orderNumber };
}

/**
 * Signs in through the real login form.
 *
 * Reserved for tests that are actually exercising authentication — login is
 * rate limited per IP, so feature tests should use `useSession` instead.
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  await page.getByPlaceholder('you@restaurant.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45_000 });
}

/**
 * Restores an already-issued session directly into browser storage, matching
 * exactly what a real login writes: the access token, the user record, and the
 * active tenant/restaurant/branch context the API client sends as headers.
 *
 * This keeps feature tests off the rate-limited login endpoint while still
 * exercising the same client-side code paths a signed-in operator hits.
 */
export async function useSession(page: Page, restaurant: SeededRestaurant): Promise<void> {
  const api = scopedApi(restaurant);

  const [tenants, restaurants, branches] = await Promise.all([
    api.get('/tenants'),
    api.get('/restaurants'),
    api.get('/branches'),
  ]);

  const tenant = (tenants.data ?? tenants).find((t: any) => t.id === restaurant.tenantId);
  const restaurantRecord = (restaurants.data ?? restaurants).find(
    (r: any) => r.id === restaurant.restaurantId,
  );
  const branch = (branches.data ?? branches).find((b: any) => b.id === restaurant.branchId);

  const me = await api.get('/users/me').catch(() => null);
  const user = me?.data ?? {
    id: 'unknown',
    name: restaurant.ownerName,
    email: restaurant.email,
    role: 'OWNER',
    status: 'ACTIVE',
  };

  // Seed storage before any app script runs, so the first render is already
  // authenticated and no redirect-to-login flashes.
  await page.addInitScript(
    ([token, userJson, tenantJson, restaurantJson, branchJson]) => {
      localStorage.setItem('atlas_access_token', token as string);
      localStorage.setItem('atlas_auth_user', userJson as string);
      localStorage.setItem('atlas_current_tenant', tenantJson as string);
      localStorage.setItem('atlas_current_restaurant', restaurantJson as string);
      localStorage.setItem('atlas_current_branch', branchJson as string);
    },
    [
      restaurant.accessToken,
      JSON.stringify(user),
      JSON.stringify(tenant),
      JSON.stringify(restaurantRecord),
      JSON.stringify(branch),
    ],
  );
}

/**
 * Matches only the text that is actually on screen.
 *
 * List screens render a mobile card layout and a desktop table from the same
 * data, with CSS hiding one of them. Both exist in the DOM, so an unscoped
 * `getByText` trips Playwright's strict mode; filtering to the visible node
 * keeps one assertion correct across every viewport project.
 */
export function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true });
}

export function visibleRole(
  page: Page,
  role: Parameters<Page['getByRole']>[0],
  options?: Parameters<Page['getByRole']>[1],
) {
  return page.getByRole(role, options).filter({ visible: true });
}

interface AtlasWorkerFixtures {
  restaurant: SeededRestaurant;
}

export const test = base.extend<{}, AtlasWorkerFixtures>({
  /**
   * Worker-scoped: one signup per worker rather than one per test.
   *
   * Signup and login are rate limited per client IP (correctly — they are
   * brute-force surfaces), and every test in a run shares one IP. Seeding once
   * per worker keeps the suite well inside those limits, and tests stay
   * independent because each creates its own orders within the workspace.
   */
  restaurant: [
    async ({}, use) => {
      const seeded = await seedRestaurant();
      await use(seeded);
    },
    { scope: 'worker' },
  ],
});

export { expect };
