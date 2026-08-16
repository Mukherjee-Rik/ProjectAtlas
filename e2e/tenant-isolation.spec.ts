import { test, expect, seedRestaurant, seedMenu, seedTable, placeCustomerOrder } from './fixtures/atlas';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';

async function apiGet(path: string, token: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...headers },
  });
  const body = await res.json().catch(() => undefined);
  return { status: res.status, body };
}

/**
 * Multi-tenant boundaries. These are regression tests: `GET /tenants` used to
 * return every tenant on the platform to any authenticated caller, and because
 * the OWNER role carries all permissions, one restaurant owner could enumerate
 * every other business.
 */
test.describe('tenant isolation', () => {
  test('an owner only sees their own tenant', async ({ restaurant }) => {
    const other = await seedRestaurant();

    const { status, body } = await apiGet('/tenants', restaurant.accessToken);
    expect(status).toBe(200);

    const tenants = body.data ?? body;
    const ids = tenants.map((t: any) => t.id);

    expect(ids).toContain(restaurant.tenantId);
    expect(ids).not.toContain(other.tenantId);
    expect(tenants).toHaveLength(1);
  });

  test("an owner cannot read another tenant's orders", async ({ restaurant }) => {
    const other = await seedRestaurant();
    const otherMenu = await seedMenu(other);
    const otherTable = await seedTable(other);
    await placeCustomerOrder(otherTable, otherMenu, 1);

    // Present our own credentials but point the context at their workspace.
    const { status } = await apiGet('/orders', restaurant.accessToken, {
      'x-tenant-id': other.tenantId,
      'x-restaurant-id': other.restaurantId,
    });

    expect([403, 404]).toContain(status);
  });

  test("an owner cannot read another tenant's menus", async ({ restaurant }) => {
    const other = await seedRestaurant();
    await seedMenu(other);

    const { status } = await apiGet('/menus', restaurant.accessToken, {
      'x-tenant-id': other.tenantId,
      'x-restaurant-id': other.restaurantId,
    });

    expect([403, 404]).toContain(status);
  });

  test('an unauthenticated caller is rejected outright', async () => {
    const res = await fetch(`${API_URL}/orders`);
    expect(res.status).toBe(401);
  });
});
