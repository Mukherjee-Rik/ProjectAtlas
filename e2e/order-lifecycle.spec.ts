import {
  test,
  expect,
  useSession,
  seedMenu,
  seedTable,
  placeCustomerOrder,
  scopedApi,
  visibleText,
  visibleRole,
} from './fixtures/atlas';

test.describe('order lifecycle', () => {
  test('a placed order appears on the orders screen with its details', async ({
    page,
    restaurant,
  }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    const order = await placeCustomerOrder(table, menu, 2);

    await useSession(page, restaurant);
    await page.goto('/orders');

    await expect(visibleText(page, order.orderNumber)).toBeVisible();
    await expect(visibleText(page, table.tableName).first()).toBeVisible();

    // 2 × 250 — proves totals survive the customer→admin round trip.
    await expect(visibleText(page, /500/).first()).toBeVisible();
  });

  test('an operator can advance an order through the full status flow', async ({
    page,
    restaurant,
  }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    const order = await placeCustomerOrder(table, menu, 1);

    await useSession(page, restaurant);
    await page.goto('/orders');

    const row = page
      .locator('li, tr')
      .filter({ visible: true })
      .filter({ hasText: order.orderNumber });

    await expect(row.first()).toBeVisible();

    // Each click advances one step; the next label only appears once the
    // mutation has settled and the list has been refetched.
    for (const action of [/confirm/i, /start prep/i, /mark ready/i, /serve/i, /complete/i]) {
      await row.first().getByRole('button', { name: action }).click();
    }

    await expect(row.first().getByText('COMPLETED')).toBeVisible({ timeout: 30_000 });

    // Confirm it persisted rather than only changing in the client cache.
    const api = scopedApi(restaurant);
    const listed = await api.get('/orders');
    const persisted = (listed.data ?? []).find((o: any) => o.id === order.orderId);
    expect(persisted?.status).toBe('COMPLETED');
  });

  test('filtering by status narrows the list', async ({ page, restaurant }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    const order = await placeCustomerOrder(table, menu, 1);

    await useSession(page, restaurant);
    await page.goto('/orders');

    await expect(visibleText(page, order.orderNumber)).toBeVisible();

    // A freshly placed order is PENDING, so Completed must exclude it.
    await visibleRole(page, 'tab', { name: 'Completed' }).click();
    await expect(visibleText(page, order.orderNumber)).toBeHidden();

    await visibleRole(page, 'tab', { name: 'Pending' }).click();
    await expect(visibleText(page, order.orderNumber)).toBeVisible();
  });

  test('cancelling an order records the cancelled state', async ({ page, restaurant }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    const order = await placeCustomerOrder(table, menu, 1);

    await useSession(page, restaurant);
    await page.goto('/orders');

    const row = page
      .locator('li, tr')
      .filter({ visible: true })
      .filter({ hasText: order.orderNumber });

    await expect(row.first()).toBeVisible();
    await row.first().getByRole('button', { name: /^cancel$/i }).click();

    await expect(row.first().getByText('CANCELLED')).toBeVisible({ timeout: 30_000 });

    const api = scopedApi(restaurant);
    const listed = await api.get('/orders');
    const persisted = (listed.data ?? []).find((o: any) => o.id === order.orderId);
    expect(persisted?.status).toBe('CANCELLED');
  });
});
