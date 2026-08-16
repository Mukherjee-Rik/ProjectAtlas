import {
  test,
  expect,
  seedMenu,
  seedTable,
  scopedApi,
  visibleText,
} from './fixtures/atlas';

/**
 * The diner-facing flow: scan a table QR, browse the menu, add an item and
 * place an order. These routes are unauthenticated and keyed on the table's
 * public token, so no session setup is needed.
 */
test.describe('customer ordering journey', () => {
  test('a diner can open a table and see its menu', async ({ page, restaurant }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);

    await page.goto(`/t/${table.token}/menu`);

    await expect(visibleText(page, menu.menuItemName).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('an invalid table token does not expose a menu', async ({ page }) => {
    await page.goto('/t/00000000-0000-0000-0000-000000000000/menu');

    // Must show a not-found/error state rather than an empty but valid-looking menu.
    await expect(
      visibleText(page, /not found|invalid|unavailable|error|expired/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('placing an order from the table makes it visible to staff', async ({
    page,
    restaurant,
  }) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);

    await page.goto(`/t/${table.token}/menu`);
    await expect(visibleText(page, menu.menuItemName).first()).toBeVisible({
      timeout: 30_000,
    });

    // The real flow: open the item sheet, then add it to the cart.
    await page.getByRole('button', { name: /view item/i }).first().click();

    const addToCart = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // The cart bar only appears once the cart actually has something in it.
    await expect(page.getByRole('link', { name: /view cart/i })).toBeVisible({
      timeout: 20_000,
    });

    // Cart → checkout → place order, the same three steps a diner takes.
    await page.goto(`/t/${table.token}/cart`);

    const continueToCheckout = page.getByRole('button', { name: /continue to checkout/i });
    await expect(continueToCheckout).toBeVisible({ timeout: 20_000 });
    await continueToCheckout.click();

    const placeOrder = page.getByRole('button', { name: /place order/i });
    await expect(placeOrder).toBeVisible({ timeout: 20_000 });
    await placeOrder.click();

    // Whatever the UI path, the order must exist server-side for this restaurant.
    await expect
      .poll(
        async () => {
          const api = scopedApi(restaurant);
          const listed = await api.get('/orders');
          return (listed.data ?? []).length;
        },
        { timeout: 30_000, message: 'expected the placed order to reach the kitchen' },
      )
      .toBeGreaterThan(0);
  });
});
