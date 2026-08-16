import { test, expect, loginAs } from './fixtures/atlas';

test.describe('authentication', () => {
  test('rejects invalid credentials without navigating away', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@restaurant.com').fill('nobody@atlas-e2e.test');
    await page.getByPlaceholder('••••••••').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Must stay on /login and surface a message rather than failing silently.
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText(/invalid|incorrect|failed|unauthor/i).first(),
    ).toBeVisible();
  });

  test('signs a restaurant owner in and shows their workspace', async ({
    page,
    restaurant,
  }, testInfo) => {
    await loginAs(page, restaurant.email, restaurant.password);

    await expect(page).not.toHaveURL(/\/login/);

    // Identity is shown as the email in the wide header, and as the owner's
    // name inside the drawer on small screens.
    // Both identities exist in the DOM at once (the header keeps a copy that
    // CSS hides on small screens), so filter to whichever is actually shown.
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /toggle navigation menu/i }).click();
      await expect(
        page.getByText(restaurant.ownerName).filter({ visible: true }).first(),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText(restaurant.email).filter({ visible: true }).first(),
      ).toBeVisible();
    }

    const restaurantSelector = page
      .locator('select')
      .filter({ hasText: restaurant.restaurantName })
      .first();
    await expect(restaurantSelector).toBeAttached();
  });

  test('redirects an unauthenticated visitor away from a protected page', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/orders');

    await page.waitForURL(/\/login/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('logging out clears the session and blocks protected pages', async ({
    page,
    restaurant,
  }, testInfo) => {
    await loginAs(page, restaurant.email, restaurant.password);

    // Logout sits in the header on wide screens and inside the drawer on mobile.
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /toggle navigation menu/i }).click();
    }

    await page
      .getByRole('button', { name: /^logout$/i })
      .filter({ visible: true })
      .first()
      .click();
    await page.waitForURL(/\/login/, { timeout: 30_000 });

    // Going back to a protected route must not restore the session.
    await page.goto('/orders');
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
