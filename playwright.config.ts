import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite for Project Atlas.
 *
 * Assumes the API (default :3000) and web app (default :3001) are already
 * running — both are started outside the test run so a suite failure never
 * leaves orphaned servers behind. Override with E2E_WEB_URL / E2E_API_URL.
 */
const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  // Each spec provisions its own restaurant, so specs are independent.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The database is in another region; be tolerant of a slow first paint.
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
