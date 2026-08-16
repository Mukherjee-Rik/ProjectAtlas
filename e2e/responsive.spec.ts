import {
  test,
  expect,
  useSession,
  seedMenu,
  seedTable,
  placeCustomerOrder,
} from './fixtures/atlas';

const PAGES = ['/dashboard', '/orders', '/tables', '/menus', '/users'];

/**
 * Layout checks that run under every viewport project (mobile, tablet,
 * desktop) from the Playwright config, so one spec covers all three.
 */
test.describe('responsive layout', () => {
  test('no page scrolls sideways at any viewport', async ({ page, restaurant }, testInfo) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    await placeCustomerOrder(table, menu, 2);

    await useSession(page, restaurant);

    for (const path of PAGES) {
      await page.goto(path);

      // Not `networkidle`: the live screens poll on an interval, so the
      // network never goes quiet and that wait would hang until timeout.
      // Waiting for the main landmark to have content is both sufficient and
      // deterministic.
      await page
        .locator('#main-content')
        .locator('h1, table, ul, [role="status"]')
        .first()
        .waitFor({ state: 'attached', timeout: 30_000 })
        .catch(() => {});

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });

      // A 1px rounding allowance; anything more is a real horizontal scrollbar.
      expect(
        overflow.scrollWidth,
        `${path} overflows horizontally at ${testInfo.project.name} (${overflow.scrollWidth}px content in ${overflow.clientWidth}px viewport)`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    }
  });

  test('order data is reachable without a horizontal scroll', async ({
    page,
    restaurant,
  }, testInfo) => {
    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    const order = await placeCustomerOrder(table, menu, 1);

    await useSession(page, restaurant);
    await page.goto('/orders');

    const visibleOrderNumber = page.getByText(order.orderNumber).filter({ visible: true });
    await expect(visibleOrderNumber).toBeVisible();

    const isMobile = testInfo.project.name === 'mobile';

    // Below the md breakpoint the same rows render as stacked cards; from md up
    // they render as a real table. Exactly one layout should be present.
    const tableVisible = await page
      .getByRole('table')
      .isVisible()
      .catch(() => false);

    expect(tableVisible).toBe(!isMobile);
  });

  test('primary navigation is reachable at every viewport', async ({
    page,
    restaurant,
  }, testInfo) => {
    await useSession(page, restaurant);
    await page.goto('/dashboard');

    if (testInfo.project.name === 'mobile') {
      // The sidebar collapses behind a menu button on small screens.
      const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
      await expect(menuButton).toBeVisible();

      await menuButton.click();
      await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible();
    }
  });

  test('tap targets on the orders screen meet the minimum touch size', async ({
    page,
    restaurant,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'touch sizing only applies to touch devices');

    const menu = await seedMenu(restaurant);
    const table = await seedTable(restaurant);
    await placeCustomerOrder(table, menu, 1);

    await useSession(page, restaurant);
    await page.goto('/orders');

    // Scoped to the app's own chrome and content. Next.js injects a dev-tools
    // button in development that is not part of the product.
    const appButtons = page.locator('header button, #main-content button');

    // `.all()` does not auto-wait, so settle on rendered content first.
    await expect(appButtons.first()).toBeVisible({ timeout: 30_000 });

    const buttons = await appButtons.filter({ visible: true }).all();
    expect(buttons.length).toBeGreaterThan(0);

    const undersized: string[] = [];
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (!box) continue;

      // Some controls deliberately opt out (e.g. a toast's close affordance,
      // which sits inside an already-large dismiss area).
      const optedOut = await button.evaluate((el) =>
        el.classList.contains('allow-small-target'),
      );
      if (optedOut) continue;

      // 44px is the widely used minimum comfortable touch target.
      if (box.height < 44) {
        const label =
          (await button.getAttribute('aria-label')) ||
          (await button.textContent())?.trim() ||
          (await button.evaluate((el) => el.className)) ||
          '<unidentified>';
        undersized.push(`"${label}" @ ${Math.round(box.height)}px`);
      }
    }

    expect(undersized, `undersized touch targets: ${undersized.join(', ')}`).toHaveLength(0);
  });
});
