import { test, expect, seedMenu, seedTable, placeCustomerOrder, scopedApi } from './fixtures/atlas';

/**
 * Proves the fixture chain itself works: signup → menu → table → customer
 * order. Everything else in the suite builds on these helpers, so when this
 * fails the cause is setup, not the feature under test.
 */
test.describe('fixture seeding', () => {
  test('provisions a restaurant, menu, table and a real order', async ({ restaurant }) => {
    expect(restaurant.restaurantId).toBeTruthy();
    expect(restaurant.branchId).toBeTruthy();

    const menu = await seedMenu(restaurant);
    expect(menu.menuItemId).toBeTruthy();

    const table = await seedTable(restaurant);
    expect(table.token).toBeTruthy();

    const order = await placeCustomerOrder(table, menu, 2);
    expect(order.orderId).toBeTruthy();
    expect(order.orderNumber).toBeTruthy();

    // The order must be visible through the authenticated admin endpoint.
    const api = scopedApi(restaurant);
    const listed = await api.get('/orders');
    const orders = listed.data ?? [];

    expect(orders.some((o: any) => o.id === order.orderId)).toBe(true);
    expect(listed.meta?.total).toBeGreaterThanOrEqual(1);
  });
});
