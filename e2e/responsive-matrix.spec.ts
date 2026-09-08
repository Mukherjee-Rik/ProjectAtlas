import { test, expect, type Page } from '@playwright/test';
import { stubSession, stubMisses, STUB } from './fixtures/stub-api';

/**
 * Sweeps every route in the app across thirteen real device widths and fails on
 * the two defects that make a page feel broken rather than merely untidy: the
 * document scrolling sideways, and a render that never produces content.
 *
 * Runs against stubbed API responses (see fixtures/stub-api.ts) so it needs no
 * database and gives the same rows on every run — a width comparison is only
 * meaningful if the content is identical at each width.
 *
 * Widths, not Playwright projects: thirteen projects would reload the app
 * thirteen times per route. One context that resizes between measurements
 * covers the same ground in a fraction of the time.
 */

const WIDTHS: Array<{ w: number; h: number; label: string }> = [
  { w: 320, h: 568, label: '320 iPhone SE (1st gen)' },
  { w: 360, h: 800, label: '360 Android baseline' },
  { w: 375, h: 667, label: '375 iPhone SE (2nd/3rd gen)' },
  { w: 390, h: 844, label: '390 iPhone 14/15' },
  { w: 414, h: 896, label: '414 iPhone 11 Pro Max' },
  { w: 430, h: 932, label: '430 iPhone 15 Pro Max' },
  { w: 667, h: 375, label: '667 phone landscape' },
  { w: 768, h: 1024, label: '768 iPad portrait' },
  { w: 820, h: 1180, label: '820 iPad Air portrait' },
  { w: 1024, h: 768, label: '1024 iPad landscape' },
  { w: 1280, h: 800, label: '1280 laptop' },
  { w: 1440, h: 900, label: '1440 laptop' },
  { w: 1920, h: 1080, label: '1920 desktop' },
  { w: 2560, h: 1440, label: '2560 wide desktop' },
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/legal',
  '/privacy',
  '/terms',
  '/cookies',
  '/acceptable-use',
  '/ai-policy',
  '/dpa',
  '/subprocessors',
  '/dmca',
  '/refunds',
  '/security',
  '/data-deletion',
  '/sitemap',
  '/docs',
  '/support',
  '/contact',
  '/talk-to-us',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/tables',
  '/tables/create',
  `/tables/${STUB.tableId}`,
  `/tables/${STUB.tableId}/edit`,
  '/branches',
  '/branches/create',
  `/branches/${STUB.branchId}`,
  `/branches/${STUB.branchId}/edit`,
  '/users',
  '/users/create',
  `/users/${STUB.userId2}`,
  `/users/${STUB.userId2}/edit`,
  '/menus',
  '/menus/create',
  `/menus/${STUB.menuId}`,
  `/menus/${STUB.menuId}/edit`,
  `/menu-items/${STUB.menuItemId}/edit`,
  '/dining-areas',
  '/inventory',
  '/table-qrs',
  '/analytics',
  '/forecasts',
  '/reports',
  '/reports/create',
  `/reports/${STUB.reportId}`,
  '/kitchen',
  '/waiter',
  '/cashier',
  '/settings',
  '/settings/ai',
  '/settings/billing',
  '/settings/organization',
  '/settings/payments',
  '/settings/privacy',
  '/settings/security',
  '/subscriptions',
  '/profile',
  '/profile/edit',
  '/onboarding',
  '/select-restaurant',
  '/restaurants',
  '/platform-admin',
];

const CUSTOMER_ROUTES = [
  `/t/${STUB.tableToken}`,
  `/t/${STUB.tableToken}/menu`,
  `/t/${STUB.tableToken}/cart`,
  `/t/${STUB.tableToken}/checkout`,
  `/t/${STUB.tableToken}/orders`,
  `/t/${STUB.tableToken}/orders/${STUB.orderId}`,
];

/** A 1px allowance for sub-pixel rounding; more than that is a real scrollbar. */
const OVERFLOW_SLACK = 1;

interface Offender {
  selector: string;
  right: number;
  width: number;
  text: string;
}

/**
 * Names the elements actually sticking out past the viewport.
 *
 * `documentElement.scrollWidth` says a page overflows but not by what, and
 * "some page is 40px too wide" is not something anyone can act on. This walks
 * the tree for the widest boxes crossing the right edge and skips ancestors of
 * an offender already found, so the report names the leaf that is too wide
 * rather than every wrapper containing it.
 */
async function findOffenders(page: Page, viewportWidth: number): Promise<Offender[]> {
  return page.evaluate((vw) => {
    const results: Array<{ selector: string; right: number; width: number; text: string }> = [];

    const describe = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/).slice(0, 6).join('.')
          : '';
      return `${tag}${id}${cls}`;
    };

    // An element inside a legitimately scrollable box is not a page overflow.
    const inScrollableAncestor = (el: Element): boolean => {
      let node = el.parentElement;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        if (
          (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden') &&
          node.scrollWidth > node.clientWidth + 1
        ) {
          return true;
        }
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true;
        node = node.parentElement;
      }
      return false;
    };

    const all = Array.from(document.querySelectorAll('body *'));
    const found: Element[] = [];

    for (const el of all) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right <= vw + 1) continue;
      if (inScrollableAncestor(el)) continue;

      // Skip an ancestor of something already reported: the leaf is the cause.
      if (found.some((f) => el.contains(f))) continue;

      found.push(el);
      results.push({
        selector: describe(el),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
      });

      if (results.length >= 6) break;
    }

    return results;
  }, viewportWidth);
}

async function measure(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyText: (document.body.textContent || '').trim().length,
  }));
}

/**
 * Waits for the screen to have settled without waiting for the network to go
 * quiet: the live screens poll on an interval, so `networkidle` never fires.
 */
async function settle(page: Page) {
  await page
    .locator('main, #main-content, body > div')
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .catch(() => {});
  // One animation frame past the last paint is enough for layout to be stable;
  // the skeletons resolve within the stub's instant responses.
  await page.waitForTimeout(450);
}

type Failure = { route: string; width: string; detail: string };

function reportTable(failures: Failure[]): string {
  if (!failures.length) return 'none';
  const byRoute = new Map<string, Failure[]>();
  for (const f of failures) {
    if (!byRoute.has(f.route)) byRoute.set(f.route, []);
    byRoute.get(f.route)!.push(f);
  }
  return [...byRoute.entries()]
    .map(([route, fs]) => `\n  ${route}\n${fs.map((f) => `      [${f.width}] ${f.detail}`).join('\n')}`)
    .join('');
}

/**
 * One test per route group rather than per route: a group shares a browser
 * context, and the failure message lists every width that broke instead of
 * stopping at the first one, so a single run gives the whole picture.
 */
function sweep(name: string, routes: string[], authenticated: boolean) {
  test(`${name}: no horizontal overflow at any device width`, async ({ page }) => {
    test.setTimeout(routes.length * 30_000 + 120_000);

    await stubSession(page, { authenticated });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`${msg.text().slice(0, 200)}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message.slice(0, 200)}`));

    const overflowFailures: Failure[] = [];
    const blankRoutes: string[] = [];

    for (const route of routes) {
      const errorsBefore = consoleErrors.length;

      await page.setViewportSize({ width: 1280, height: 800 });
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => null);

      if (response && response.status() >= 500) {
        blankRoutes.push(`${route} -> HTTP ${response.status()}`);
        continue;
      }

      await settle(page);

      const base = await measure(page);
      if (base.bodyText < 40) {
        blankRoutes.push(
          `${route} -> rendered ${base.bodyText} chars of text${
            consoleErrors.length > errorsBefore ? ` (console: ${consoleErrors[errorsBefore]})` : ''
          }`,
        );
        continue;
      }

      for (const { w, h, label } of WIDTHS) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(160);

        const m = await measure(page);
        if (m.scrollWidth > m.clientWidth + OVERFLOW_SLACK) {
          const offenders = await findOffenders(page, m.clientWidth);
          overflowFailures.push({
            route,
            width: label,
            detail:
              `${m.scrollWidth}px content in ${m.clientWidth}px viewport (+${m.scrollWidth - m.clientWidth}px)` +
              (offenders.length
                ? `\n            offenders: ${offenders
                    .map((o) => `${o.selector} [w=${o.width} right=${o.right}] "${o.text}"`)
                    .join('\n                       ')}`
                : ''),
          });
        }
      }
    }

    const problems: string[] = [];
    if (blankRoutes.length) problems.push(`Routes that rendered nothing:\n  ${blankRoutes.join('\n  ')}`);
    if (overflowFailures.length) problems.push(`Horizontal overflow:${reportTable(overflowFailures)}`);

    // Surfaced, not asserted: a missing fixture is a gap in this harness, not
    // a defect in the app.
    if (stubMisses.size) {
      console.log(`\n[stub-api] no fixture for ${stubMisses.size} paths:\n  ${[...stubMisses].sort().join('\n  ')}`);
    }
    if (consoleErrors.length) {
      const unique = [...new Set(consoleErrors)];
      console.log(`\n[console] ${unique.length} unique errors:\n  ${unique.slice(0, 25).join('\n  ')}`);
    }

    expect(problems.join('\n\n') || 'clean', problems.join('\n\n')).toBe('clean');
  });
}

test.describe('responsive matrix', () => {
  // These specs measure layout, not the product, so they do not need the
  // per-worker seeded restaurant the rest of the suite uses.
  test.describe.configure({ mode: 'parallel' });

  sweep('public pages', PUBLIC_ROUTES, false);
  sweep('protected pages', PROTECTED_ROUTES, true);
  sweep('customer QR pages', CUSTOMER_ROUTES, false);
});
