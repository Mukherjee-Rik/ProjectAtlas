# End-to-end tests

Playwright suite covering the critical Atlas flows at three viewports —
`desktop` (1280×800), `tablet` (768×1024) and `mobile` (Pixel 7).

## Running

Both servers must already be running; the suite does not start them, so a
failing run never leaves orphaned processes behind.

```bash
pnpm dev
```

Then, in a second terminal:

```bash
pnpm test:e2e
```

Useful variants:

```bash
pnpm test:e2e:desktop
```

```bash
pnpm test:e2e:mobile
```

```bash
pnpm test:e2e:report
```

### Rate limits

`/auth/login` and `/auth/signup` are rate limited to 5 requests per minute per
client IP. Every test shares one IP, so the API must be started with raised
limits or the suite will fail with `429`:

```bash
AUTH_LOGIN_LIMIT=200 AUTH_SIGNUP_LIMIT=200 AUTH_REFRESH_LIMIT=200 pnpm start:api
```

Leave the defaults alone in production — they are the brute-force protection.

## How the suite is structured

`fixtures/atlas.ts` provides everything the specs build on:

- **`restaurant`** — a worker-scoped fixture that signs up a fresh tenant,
  restaurant, branch and trial subscription through the real API. Worker-scoped
  rather than per-test so the run stays inside the auth rate limits; tests stay
  independent because each creates its own orders inside the workspace.
- **`seedMenu` / `seedTable`** — menu → category → item, and dining area →
  table, returning the table's public QR token.
- **`placeCustomerOrder`** — drives the public session → cart → order endpoints
  to create a genuine order.
- **`loginAs`** — signs in through the real form. Reserved for the auth spec,
  since login is rate limited.
- **`useSession`** — restores an already-issued session into browser storage
  (token, user, tenant/restaurant/branch context). Feature specs use this to
  stay off the login endpoint.
- **`visibleText` / `visibleRole`** — list screens render a mobile card layout
  *and* a desktop table from the same data, with CSS hiding one. Both are in the
  DOM, so unscoped queries trip Playwright's strict mode; these filter to
  whichever is actually on screen and keep one assertion valid at every
  viewport.

## Coverage

| Spec | What it protects |
| --- | --- |
| `smoke-seed` | The fixture chain itself: signup → menu → table → order → visible to staff. When this fails, the cause is setup rather than a feature. |
| `auth` | Invalid credentials rejected, successful sign-in resolves tenant context, protected routes redirect, logout truly clears the session. |
| `order-lifecycle` | An order reaches the orders screen with correct totals, advances through all five statuses, filters by status, and cancels — each verified in the UI *and* re-read from the API so a client-cache-only change cannot pass. |
| `customer-journey` | Diner opens a table by QR token, browses the menu, adds to cart, checks out; invalid tokens expose nothing. |
| `tenant-isolation` | An owner sees only their own tenant and cannot read another tenant's orders or menus. Regression cover for a real leak: `GET /tenants` previously returned every tenant on the platform to any authenticated caller. |
| `responsive` | No page scrolls sideways at any viewport, the right layout renders per breakpoint, navigation is reachable, and touch targets meet 44px on mobile. |
