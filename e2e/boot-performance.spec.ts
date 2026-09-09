import { test, expect, type Page, type Request } from '@playwright/test';
import { stubSession } from './fixtures/stub-api';

/**
 * Measures what "the app feels slow" actually means: how long a signed-in
 * operator waits for real content, and how much of that wait is round trips
 * happening one after another instead of together.
 *
 * Every API response is stubbed with a fixed delay (see LATENCY), so the number
 * this produces is a property of the app's own request graph rather than of
 * whatever the network was doing. A chain of four dependent calls at 120ms
 * cannot finish in less than 480ms no matter how fast the machine is; four
 * parallel calls finish in 120ms. That difference is the thing being measured.
 */

/** Per-request delay. Roughly a regional round trip, and slow enough that a
 *  chain is unmistakable against a fan-out. */
const LATENCY = 120;

const PAGES = ['/dashboard', '/orders', '/tables', '/analytics'];

interface Sample {
  path: string;
  startedAt: number;
  finishedAt: number;
}

/**
 * Groups requests into waves by start time.
 *
 * Two requests that start within one latency period of each other were issued
 * concurrently; one that starts only after another has finished was waiting on
 * it. Counting waves therefore counts the depth of the dependency chain, which
 * is what the user actually waits through.
 */
function waves(samples: Sample[]): Sample[][] {
  const sorted = [...samples].sort((a, b) => a.startedAt - b.startedAt);
  const out: Sample[][] = [];

  for (const s of sorted) {
    const current = out[out.length - 1];
    if (!current) {
      out.push([s]);
      continue;
    }
    const earliestFinishInWave = Math.min(...current.map((c) => c.finishedAt));
    // Started before anything in the current wave came back => concurrent.
    if (s.startedAt < earliestFinishInWave) current.push(s);
    else out.push([s]);
  }

  return out;
}

async function instrument(page: Page): Promise<{ samples: Sample[]; reset: () => void }> {
  const samples: Sample[] = [];
  const started = new Map<Request, number>();

  page.on('request', (req) => {
    if (req.url().includes('/api/proxy')) started.set(req, Date.now());
  });
  page.on('requestfinished', (req) => {
    const at = started.get(req);
    if (at === undefined) return;
    started.delete(req);
    const url = new URL(req.url());
    samples.push({
      path: url.pathname.replace(/^.*\/api\/proxy/, '') || '/',
      startedAt: at,
      finishedAt: Date.now(),
    });
  });

  return { samples, reset: () => samples.splice(0, samples.length) };
}

/** Time until the page shows something other than a loading placeholder. */
async function timeToContent(page: Page, budgetMs: number): Promise<number> {
  const start = Date.now();
  await page
    .locator('#main-content h1, #main-content h2, #main-content table, #main-content [data-content]')
    .first()
    .waitFor({ state: 'visible', timeout: budgetMs })
    .catch(() => {});
  return Date.now() - start;
}

test.describe('boot performance', () => {
  test('a cold protected page load is not a chain of dependent round trips', async ({ page }) => {
    test.setTimeout(180_000);

    await stubSession(page);

    // Hold every API response for a fixed, realistic delay so a serialized
    // chain is distinguishable from a fan-out.
    await page.route('**/api/proxy/**', async (route) => {
      await new Promise((r) => setTimeout(r, LATENCY));
      await route.fallback();
    });

    const { samples } = await instrument(page);

    const t0 = Date.now();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const contentAt = await timeToContent(page, 30_000);
    await page.waitForTimeout(1500);
    const total = Date.now() - t0;

    const w = waves(samples);
    const report = w
      .map(
        (wave, i) =>
          `  wave ${i + 1} (+${wave[0].startedAt - t0}ms): ` +
          wave.map((s) => s.path.split('?')[0]).join(', '),
      )
      .join('\n');

    console.log(
      `\n[boot] /dashboard cold load\n` +
        `  requests: ${samples.length}\n` +
        `  sequential waves: ${w.length}\n` +
        `  time to first content: ${contentAt}ms\n` +
        `  settled at: ${total}ms\n${report}\n`,
    );

    // Some serialization is unavoidable: the session must be known before
    // tenant-scoped data can be asked for. Beyond three waves, requests that
    // could have been issued together are queueing behind each other.
    expect(
      w.length,
      `A cold /dashboard load issues ${w.length} sequential waves of requests ` +
        `before settling. Each wave costs a full round trip, so the operator waits ` +
        `${w.length} x latency before seeing data.\n${report}`,
    ).toBeLessThanOrEqual(3);
  });

  test('navigating between protected pages reuses cached context', async ({ page }) => {
    test.setTimeout(180_000);

    await stubSession(page);
    await page.route('**/api/proxy/**', async (route) => {
      await new Promise((r) => setTimeout(r, LATENCY));
      await route.fallback();
    });

    const { samples, reset } = await instrument(page);

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await timeToContent(page, 30_000);
    await page.waitForTimeout(1200);

    // The context calls — who am I, which tenant, which restaurant, what plan —
    // are the same on every screen. Paying for them again on each navigation is
    // the difference between an app that feels instant and one that does not.
    const CONTEXT = ['/users/me', '/tenants', '/restaurants', '/branches', '/subscriptions/my-subscription', '/tenant-memberships'];
    const refetched: Record<string, number> = {};

    for (const path of PAGES.slice(1)) {
      reset();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await timeToContent(page, 30_000);
      await page.waitForTimeout(1200);

      for (const s of samples) {
        const base = s.path.split('?')[0];
        if (CONTEXT.some((c) => base.startsWith(c))) {
          refetched[`${path} -> ${base}`] = (refetched[`${path} -> ${base}`] || 0) + 1;
        }
      }
    }

    const offenders = Object.entries(refetched);
    console.log(
      `\n[boot] context refetches on navigation: ${offenders.length}\n` +
        (offenders.length ? offenders.map(([k, v]) => `  ${k} x${v}`).join('\n') : '  none') +
        '\n',
    );

    expect(
      offenders.map(([k, v]) => `${k} x${v}`).join('\n') || 'none',
      `Session/tenant/plan context was refetched while navigating between protected pages. ` +
        `These are identical across screens and should come from the react-query cache ` +
        `(staleTime 30s), so each one is a round trip the operator waits through for nothing.`,
    ).toBe('none');
  });
});
